export const removeLoader = () => {
  const loader = document.getElementById('root-loader');
  if (loader) {
    loader.remove();
  }
};