
# Quizzeria

Quizzeria is a web app which I designed to help students study more effectively by turning their PDF coursebooks into interactive learning tools. You can upload your documents, chat with them to ask questions, and generate quizzes to test your knowledge!

**Live Link:** https://quizzeria-seven.vercel.app



## Tech Stack

**Client:** Next.js, Redux, TailwindCSS
**Backend:** Next.js API Routes
**Database:** Supabase
**AI/LLM:** Google Gemini 2.5 Flash, LangChain.js
**PDF Processing:** pdf-parse


## 🔗 Links
[![Vercel](https://img.shields.io/badge/Vercel-%23000000.svg?logo=vercel&logoColor=white)](https://quizzeria-seven.vercel.app)
[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ayan-sinha21/)
[![GitHub](https://img.shields.io/badge/GitHub-%23121011.svg?logo=github&logoColor=white)](https://github.com/89rx/quizzeria)


## Run Locally

Clone the project

```bash
  git clone https://github.com/89rx/quizzeria.git](https://github.com/89rx/quizzeria.git
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```


## Environment Variables

To run this project, you will need to add the following environment variables to your .env.local file

NEXT_PUBLIC_SUPABASE_URL=https://afcwhoinwxtmlxatopfk.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmY3dob2lud3h0bWx4YXRvcGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzQ0NzMsImV4cCI6MjA3NTM1MDQ3M30.611kXJmAzyA3-UMQoEgne6MWf8gxwQtAhbhIlRP9vHo

GOOGLE_API_KEY=AIzaSyA3_LM-vTopWkioMbXvvKCdbzVQIyrBtJA

## Features

- PDF Upload & Source Selection
- PDF Viewer
- Quiz Engine
- Progress Tracking Dashboard
- AI-Powered Chat

Please note that I could not add the YouTube Video Recommender and the Citations. While the groundwork for getting page numbers is there, I couldn't get the final implementation done. I have my midterms going on currently and managing both in 3 days was not enough :(


## LLM Tools

This project uses Large Language Models pretty heavily for its main features:

- Quiz Generation
- Chat (RAG)
- Topic Extraction (for the Progress Dashboard)
- Chat Title Generation
## Conclusion

Overall, I had a lot of fun working on this project! It was a great learning experience, especially when it came to building a full RAG (Retrieval-Augmented Generation) pipeline from scratch and managing the state of a multi-panel, interactive application. A lot of the things were new to me and I'm glad to have been a part of this process. Hope you guys like it :D

