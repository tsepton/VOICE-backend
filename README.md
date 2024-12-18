# VOICE Backend
> This repository is part of the VOICE Operating In Contextual Environment (VOICE) project.  



## Specifying the LLM  
In order for the backend to work, it is necessary to specify the LLM you want to use. 
Current version supports communication with a distant OpenAI model, or locally with a model from [Ollama](https://ollama.com/).

### Self-hosting
Make sure [Ollama](https://github.com/ollama/ollama/releases/) is installed and running on your machine. Default model is `llama3.2-vision`.
Update `HOST` (default=`0.0.0.0`) and `PORT` (default=`3000`) variables inside the `.env` file at the root of the folder hierarchy. 

OpenAI's related settings can be safely ignored.

> [!IMPORTANT] 
> Make sure it is available locally by running `ollama pull llama3.2-vision`.

### Remote hosting 
If you want to use an OpenAI model instead of default Ollama, specify it inside the `.env` file using the `USE_LOCAL` variable. Don't forget to set your OpenAI API key with `OPENAI_API_KEY`. Default model is `gpt-4o`.

Ollama's related settings can be safely ignored.

### Customize the prompt
Given all the models available to use, tailor-made prompts have been made for the `gpt-4o` distant model and for the `llama3.2-vision` self-hosted model.
It is also possible to specify another model to use inside the `.env` file through the `MODEL` variable.
Any other model specified will have the default self-hosted or remote prompt, depending on the `USE_LOCAL` variable.  

> [!TIP]
> Using default prompting may yield bad results. 
> You can implement your own prompting by implementing the `Assistant` interface (see the interface and factory inside `src/libs/assistant/assistant.ts`). 

> [!IMPORTANT]  
> Make sure the model you specify has vision capability. For distant model hosted by OpenAI, see [this list](https://platform.openai.com/docs/models) of available models. For self-hosting, make sure that it is available locally : `ollama pull <model-name>`. See available options [here](https://ollama.com/search?c=vision).

## Running

Run the following: 
```bash
nvm use 18

npm install 
npm run dev
```

### Debuging 

#### Langchain Tracing
Langchain tracing is disabled by default but can be useful to debug or inspect LLM queries.
To activate it, modify the `.env` file by setting `LANGCHAIN_TRACING_V2` to `true` and update the file with the langchain project name and API key. 
