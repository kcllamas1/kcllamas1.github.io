const newQuoteButton = document.querySelector('#js-new-quote');
const answerButton = document.querySelector('#js-tweet');

const apiEndpoint = 'https://trivia.cyberwisp.com/getrandomchristmasquestion';

let currentAnswer = '';

function displayQuote(data) {
  document.querySelector('#js-quote-text').textContent = data.question;
  document.querySelector('#js-answer-text').textContent = '';
  currentAnswer = data.answer;
}

function getQuote() {
  fetch(apiEndpoint)
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(function(data) {
      console.log(data);      
      displayQuote(data);   
    })
    .catch(function(error) {
      console.error('Error:', error);    
      alert('Failed to fetch a question!'); 
    });
}


function displayAnswer() {
  document.querySelector('#js-answer-text').textContent = currentAnswer;
}

newQuoteButton.addEventListener('click', getQuote);
answerButton.addEventListener('click', displayAnswer);

getQuote();