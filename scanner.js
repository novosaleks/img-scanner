'use strict';

/**
 * Scans the DOM for newly added images and injects custom alternative text (alt) attributes.
 * If specified, it can overwrite existing alt attributes not set by this script.
 *
 * @param {boolean} overwriteExistingAlt - If true, overwrites existing alt attributes not set by this script.
 * @returns {Promise<void>} - A Promise that resolves when the initialization is complete.
 *
 * @throws {Error} - If there is an issue during fetching words via the API.
 */
const scanAndInjectAlt = async (overwriteExistingAlt= false) => {
  // constants
  const dataAlterAttribute = 'data-userway_altered';
  const alteredImgStyles = `
    [${dataAlterAttribute}] {
      border: .5rem solid blue;
      box-sizing: border-box;
    }
  `;
  const BASE_URL = 'https://random-word-api.herokuapp.com/word';
  const mutationOptions = {childList: true, subtree: true};
  const tooltipInput = document.createElement('input');

  // methods
 const handleDOMMutations = async (mutations) => {
    const newImages = [];

    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode instanceof HTMLImageElement) {
          newImages.push(addedNode);
        }
      }
    }

    if (newImages.length) {
      await setAttributes(newImages);
    }
  }

  const onTooltipHandle = async (e) => {
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

  const setAttributes = async (images) => {
    const imagesToChange = getImagesNeedsToModify(images);
    const words = await getRandomWords(imagesToChange.length);

    imagesToChange.forEach((img, i) => {
      img.alt = words[i];
      img.setAttribute(dataAlterAttribute, '');
    });
  }

  const getImagesNeedsToModify = (imgCollection) => {
    return [...imgCollection].filter(isImproperImage);
  }

  const isImproperImage = (img) => {
    return !(
      !overwriteExistingAlt && img.getAttribute('alt') ||
      overwriteExistingAlt && img.hasAttribute(dataAlterAttribute)
    );
  }

  const createCustomAlt = (innerValue, {x, y}) => {
    return new Promise((res) => {
      placeTooltipInDom(innerValue, {x, y});

      const cleanUpTooltip = (newAltText) => {
        res(newAltText);
        tooltipInput.removeEventListener('keydown', onKeyDown);
        document.body.removeEventListener('click', onOutsideTooltipClick);
        tooltipInput.remove();
      }

      const onKeyDown = e => {
        if (e.key === 'Enter') {
          cleanUpTooltip(e.target.value)
        }
        if (e.key === 'Escape') {
          cleanUpTooltip(innerValue)
        }
      }

      const onOutsideTooltipClick = (e) => outsideClickHandler(e, tooltipInput, () => {
        cleanUpTooltip(tooltipInput.value);
      });

      tooltipInput.addEventListener('keydown', onKeyDown);
      document.body.addEventListener('click', onOutsideTooltipClick)
    });
  }

  const placeTooltipInDom = (innerValue, {x, y}) => {
    tooltipInput.style.cssText = getTooltipStyles({x, y});
    tooltipInput.value = innerValue;
    document.body.appendChild(tooltipInput);
    tooltipInput.focus();
  }

  const outsideClickHandler = (e, nodeElement, cb) => {
   if (e.target !== nodeElement) {
      cb();
    }
  }

  const getTooltipStyles = ({x, y}) => {
    return `
      position: absolute;
      top: ${y}px;
      left: ${x}px;
    `
  }

  const injectCSSForAlteredImages = () => {
    const styleSheet = document.createElement('style');

    styleSheet.insertAdjacentText('beforeend', alteredImgStyles);
    document.head.append(styleSheet);
  }

  // api functions
  const getRandomWords = async (size) => {
    try {
      return await getWords(size);
    } catch (e) {
      console.warn('Error during fetching words. Using default instead')
      return new Array(size).fill('picture');
    }
  }

  const getWords = async (size = 1) => {
    const url = `${BASE_URL}?number=${size}`;
    const data = await fetch(url);

    if (!data.ok) {
      throw new Error(`Error status code: ${data.status}`);
    }

    return await data.json();
  }

  // state
  let tooltipActive = false;

  const init = async () => {
    const imgsCollection = document.getElementsByTagName('img');
    const mutationObserver = new MutationObserver(handleDOMMutations);

    document.body.addEventListener('click', onTooltipHandle);
    injectCSSForAlteredImages();
    mutationObserver.observe(document.body, mutationOptions);
    await setAttributes(imgsCollection);

    // cleanup function
    return () => {
      mutationObserver.disconnect();
      document.body.removeEventListener('click', onTooltipHandle);
    }
  }

  await init();
}
