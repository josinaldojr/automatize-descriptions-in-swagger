const { OpenAI } = require("openai");

const fs = require('fs');
const yaml = require('js-yaml');
require('dotenv').config();
const path = require('path');
  
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const swaggerFolderPath = path.join(__dirname, 'swagger'); 
const resultFolderPath = path.join(__dirname, 'result'); 

async function generateDescription(text) {
  try {
    const response = await openai.chat.completions.create({
        model: "text-davinci-003",
        messages: [{ role: 'user', content: text }],
        max_tokens: 2048,
        temperature: 1
    })

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Erro ao chamar a API do OpenAI:', error);
    throw error;
  }
}

async function processSwaggerFile(file) {
    const inputFile = path.join(swaggerFolderPath, file);
    const outputFile = path.join(resultFolderPath, file);
  
    try {
      const swaggerData = yaml.load(fs.readFileSync(inputFile, 'utf8'));
  
      for (const path in swaggerData.paths) {
        for (const method in swaggerData.paths[path]) {
          if (swaggerData.paths[path][method].description) continue; 
          const description = await generateDescription(`Descreva o endpoint ${method.toUpperCase()} ${path}`);
          swaggerData.paths[path][method].description = description;
        }
      }
  
      for (const definition in swaggerData.definitions) {
        if (swaggerData.definitions[definition].description) continue; 
        const description = await generateDescription(`Descreva o objeto ${definition}`);
        swaggerData.definitions[definition].description = description;
      }
  
      const newYaml = yaml.safeDump(swaggerData);
      fs.writeFileSync(outputFile, newYaml, 'utf8');
      console.log(`Novo arquivo YAML criado com sucesso em ${outputFile}.`);
    } catch (e) {
      console.log(e);
    }
}

try {
    const files = fs.readdirSync(swaggerFolderPath);
  
    files.forEach(processSwaggerFile);
} catch (e) {
    console.log(e);
}