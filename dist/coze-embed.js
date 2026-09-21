const dialog = document.querySelector('[data-coze-dialog]');
const openButton = document.querySelector('[data-coze-open]');
const closeButton = document.querySelector('[data-coze-close]');
const openDialog = () => {
  dialog.showModal();
  document.body.classList.add('dialog-open');
};

const closeDialog = () => dialog.close();

openButton?.addEventListener('click', openDialog);
closeButton?.addEventListener('click', closeDialog);
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) closeDialog();
});
dialog?.addEventListener('close', () => document.body.classList.remove('dialog-open'));
