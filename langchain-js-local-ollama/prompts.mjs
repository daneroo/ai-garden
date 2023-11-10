export function getSummaryPrompts() {
  return {
    questionPrompt: `
You are an expert in summarizing classical philosophy articles.
Your goal is to create a summary of an article.
Below you find the transcript of an article:
--------
{text}
--------

Total output will be a summary of the article.

SUMMARY:
`,
    refinePrompt: `
You are an expert in summarizing classical philosophy articles.
Your goal is to create a summary of an article.
We have provided an existing summary up to a certain point: {existing_answer}

Below you find a portion of the article:
--------
{text}
--------

Given the new context, refine the summary.
If the context isn't useful, return the original summary.

Total output will be a summary of the article.

SUMMARY:
`,
  };
}

export function getSummaryWithQuestionsPrompts() {
  return {
    questionPrompt: `
You are an expert in summarizing classical philosophy articles.
Your goal is to create a summary of an article.
Below you find the transcript of an article:
--------
{text}
--------

The transcript of the article will also be used as the basis for a question and answer bot.
Provide a few example questions and answers that could be asked about the article. Make these questions very specific.

Total output will be a summary of the article and a list of example questions and answers a reader could ask about the article.

SUMMARY AND QUESTIONS:
`,
    refinePrompt: `
You are an expert in summarizing classical philosophy articles.
Your goal is to create a summary of an article.
We have provided an existing summary up to a certain point: {existing_answer}

Below you find the transcript of a portion of the article:
--------
{text}
--------

Given the new context, refine the summary and example questions.
The transcript of the article will also be used as the basis for a question and answer bot.
Provide some example questions and answers that could be asked about the article.
Make these questions very specific.
If the context isn't useful, return the original summary and questions.

Total output will be a summary of the article and a list of example questions and answers a reader could ask about the article.

SUMMARY AND QUESTIONS:
`,
  };
}
