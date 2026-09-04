document.getElementById('description').showModal();

document.getElementById('description').addEventListener('click',e=>{
  if(e.target.closest('#description-container') === null) {
    document.getElementById('description').close();
  }
})
