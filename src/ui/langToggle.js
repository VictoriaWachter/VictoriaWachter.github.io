export const initLangToggle = applyLang => {
  document.querySelectorAll('.langs button').forEach(b => b.addEventListener('click', () => applyLang(b.dataset.lang)));
};
