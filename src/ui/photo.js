export const initPhoto = () => {
  const img = document.querySelector('#photoImg');
  img.addEventListener('load', () => { img.hidden = false; document.querySelector('#photoPh').hidden = true; });
  img.src = '/victoria.jpg';
};
