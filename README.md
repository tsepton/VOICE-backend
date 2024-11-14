# Vass Backend
> This repository is part of the Vass project.  



## Specifying the LLM  
In order for the vass-backend to work, it is necessary to specify the LLM you want to use. 
Current implementation has prompting for [Ollama](https://ollama.com/), and for OpenAI API.  

### Using Ollama 
Make sure [Ollama](https://github.com/ollama/ollama/releases/) is installed and running on your machine. Default prompting uses `llama3.2-vision`.

> [!IMPORTANT] 
> Make sure it is available locally by running `ollama run llama3.2-vision`.


#### Customization
It is also possible to specify the model you want to use inside the `.env` file `OLLAMA_MODEL` variable.



> [!IMPORTANT]  
> Make sure the model you specify has vision capability. Again, make sure that it is available locally : `ollama run <model-name>`.

> [!TIP]
> Using default prompting may yield bad results as it was designed for `llama3.2-vision`. 
> You can implement your own prompting by implementing the `Assistant` interface (see the interface and factory inside `src/libs/assistant/assistant.ts`). 


### Using OpenAI API 
If you want to use OpenAI API instead of default Ollama, specify it inside the `.env` file using the `USE_OPENAI` variable. Don't forget to set your OpenAI API key. Ollama's configuration will be ignored.

## Running
Make sure to add `HOST` (default=`0.0.0.0`) and `PORT` (default=`3000`) variable inside the `.env` file at the root of the folder hierarchy. 
Run the following: 
```bash
mkdir generated

nvm use 18

npm install 
npm run dev
```

### Debuging 

#### Langchain Tracing
Langchain tracing is disabled by default. 
To activate it, modify the `.env` file by setting `LANGCHAIN_TRACING_V2` to `true` and update the file with the langchain project name and API key. 
