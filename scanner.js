'use strict';
(() => {
  // constants
  const dataAlterAttribute = 'data-userway_altered';
  const alteredImgStyles = `
    [${dataAlterAttribute}] {
      border: .5rem solid blue;
      box-sizing: border-box;
    }
  `;
  const BASE_URL = 'https://random-word-api.herokuapp.com/word?number='
  const mutationOptions = {childList: true, subtree: true};

  // live collection
  const imgsLiveCollection = document.getElementsByTagName('img');
  const mutationObserver = new MutationObserver(handleDOMMutations);

  const tooltipInput = document.createElement('input');
  let tooltipActive = false;

  init();

  function init() {
    document.body.addEventListener('click', tooltipHandle);
    injectCSSForAlteredImages(alteredImgStyles);
    mutationObserver.observe(document.body, mutationOptions);
    setAttributes(dataAlterAttribute);
  }

  function handleDOMMutations(mutations) {
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode instanceof HTMLImageElement) {
          setAttributes(dataAlterAttribute);
          return;
        }
      }
    }
  }

  async function tooltipHandle(e) {
    if (e.target && e.target.tagName === 'IMG' && !tooltipActive) {
      tooltipActive = true;

      const currentAltText = e.target.alt === 'undefined' ? '' : e.target.alt;
      const customAltText = await createCustomAlt(currentAltText || '', {x: e.clientX, y: e.clientY});

      if (customAltText !== currentAltText && customAltText.trim()) {
        e.target.alt = customAltText;
      }

      tooltipActive = false;
    }
  }

  async function setAttributes(dataAttribute) {
    const imagesToChange = getImagesNeedsToModify(imgsLiveCollection);
    const words = await getRandomWords(imagesToChange.length);

    imagesToChange.forEach((img, i) => {
      img.alt = words[i]
      img.setAttribute(dataAttribute, '');
    });
  }
  function getImagesNeedsToModify(imgCollection) {
    const imagesToChange = [];

    for (let i = 0; i < imgCollection.length; i++) {
      if (!imgsLiveCollection[i].hasAttribute('')) {
        imagesToChange.push(imgsLiveCollection[i]);
      }
    }
    return imagesToChange;
  }
  function createCustomAlt(innerValue, {x, y}) {
    return new Promise((res) => {
      tooltipInput.style.cssText = getTooltipStyles({x, y});
      tooltipInput.value = innerValue;
      document.body.appendChild(tooltipInput);
      tooltipInput.focus();

      const onKeyDown = e => {
        if (e.key === 'Enter') {
          res(e.target.value);
          tooltipInput.removeEventListener('keydown', onKeyDown)
          tooltipInput.remove();
        }
      }

      tooltipInput.addEventListener('keydown', onKeyDown)
    })
  }
  function getTooltipStyles({x, y}){
    return `
      position: absolute;
      top: ${y}px;
      left: ${x}px;
    `
  }

  function injectCSSForAlteredImages(alteredImgStyles) {
    const styleSheet = document.createElement('style');
    styleSheet.insertAdjacentText('beforeend', alteredImgStyles);
    document.head.append(styleSheet);
  }

  // api functions
  async function getRandomWords(size) {
    try {
      return await getWords(size);
    } catch (e) {
      return new Array(size).fill('picture');
    }
  }
  async function getWords(size = 1) {
    const data = await fetch(BASE_URL + size);
    return await data.json();
  }
})();
