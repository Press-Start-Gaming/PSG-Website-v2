window.addEventListener('load', () => {
  console.log(user);

  // Get element by id
  const accountP = document.getElementById('account-p');
  accountP.textContent = `Welcome, ${user.nickname}!<br>This page is still a work in progress.`;
});
