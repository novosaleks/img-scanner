'use strict';

const imgs = document.getElementsByTagName('img');

const getRandomWords = async (size) => {
  try {
    const data = await fetch(`https://random-word-api.herokuapp.com/word?number=${size}`);
    return await data.json();
  } catch (e) {
    return 'Picture';
  }
}

const setAttributes = async () => {
  const numberOfAttributes = imgs.length;

  const words = await getRandomWords(numberOfAttributes);

  for (let i = 0; i < imgs.length; i++) {
    imgs[i].alt = words[i]
  }
}

setAttributes();


