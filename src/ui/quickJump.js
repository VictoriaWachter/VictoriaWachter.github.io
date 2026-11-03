export const initQuickJump = ({ reduce, getTops, getHs }) => {
  document.querySelectorAll('[data-jump]').forEach(b => b.addEventListener('click', () => {
    const tops = getTops(), hs = getHs();
    const i = +b.dataset.jump, vh = innerHeight;
    const top = i === 7 ? document.documentElement.scrollHeight - vh : tops[i] + hs[i] * 0.4 - vh * 0.55;
    scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }));
};
