(async () => {
  const style_str = `  /* Modal Background */
.modal-overlay {
  display: block; 
  opacity: 0.0001;
  visibility: hidden;
  position: fixed; 
  z-index: 9999; 
  left: 0; top: 0;
  width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.6); /* Semi-transparent black */
}

/* Modal Box */
.modal-content {
  background-color: #fff;
  margin: 15% auto;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 500px;
  position: relative;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

/* Close Button */
.close-modal {
    display: none;
    position: absolute;
    right: 35px;
    top: 20px;
    font-size: 3rem;
    cursor: pointer;
    color: #333;
    z-index: 100;
}`;

  const html_str = `<div id="bca_info_modal" class="modal-overlay" style="display: block;">
  <div class="modal-content">
    <span class="close-modal">×</span>    
    <div style="
    background: beige !important;
    border: 1px solid wheat !important;
    border-radius: 0;
    padding: 20px;
">
  <div style='display: block; height: 100px max-height: 120px;'>
      <!-- ptc_pop_ads -->
<ins class="adsbygoogle"
     style="display:inline-block;width:100%; height: 100px;"
     data-ad-client="ca-pub-7151582089386175"
     data-ad-slot="8441758107"></ins>
  </div>
      <h2 id='bca_modal_message'>Hello Catters!</h2><span>We gladly welcome you to this website! There are some updates you would want to know. This notif box will tell everything you need to know. Thank you.</span>
<br><br>
      <a href='https://battlecatsarchive.blogspot.com/2026/04/ptc-battle-cats-mods-en-update-v15-3-0-mediafire-download.html'>EN 15-3-0 is released!</a><br/>
<a href='https://battlecatsarchive.blogspot.com/2026/04/all-ptc-mods-update-jp-battle-cats-v-15-3-0.html'>JP 15-3-0 is released!</a>
<br><br>
<a href='https://battlecatsarchive.blogspot.com/p/official-battle-cats-account-request.html'>EN 15-3-0 accounts are re-stocked!</a>
      <br>
<a href='https://battlecatsarchive.blogspot.com/p/official-battle-cats-account-request.html'>JP 15-3-0 accounts are re-stocked!</a></div>

  </div>
</div>`;

  // inject html to the body first
  let dummy_html = document.createElement('div');
  let styleTag = document.createElement('style');
  styleTag.textContent = style_str;
  dummy_html.innerHTML = html_str;

  document.querySelector('body').appendChild(dummy_html);
  document.querySelector('head').appendChild(styleTag);

  const modal = document.getElementById("bca_info_modal");
  const span = document.getElementsByClassName("close-modal")[0];

  // Close modal when clicking (x)
  initModal();

  span.onclick = function () {
    closeModal();
  }

  document.getElementById('bca_modal_message').innerHTML = `${getGreeting()} Catters!`;

  function getGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return "Good morning 🌅";
    } else if (hour >= 12 && hour < 17) {
      return "Good afternoon ☀️";
    } else if (hour >= 17 && hour < 21) {
      return "Good evening 🌆";
    } else {
      return "Good night 🌙";
    }
  }

  function closeModal() {
    modal.style.visibility = "hidden";
    modal.style.opacity = "0.001";
    modal.style.display = "block";
  }

  function showModal() {
    modal.style.visibility = "visible";
    modal.style.opacity = "1";
    modal.style.display = "block";
  }


  function initModal() {
    const modal_id = "BCA_POP_MODAL";
    const LSMODAL = parseInt(localStorage.getItem(modal_id));
    const now = new Date().getTime();

    // pushing adsense code
    (adsbygoogle = window.adsbygoogle || []).push({});

    if (!LSMODAL) {
      // create a new record
      localStorage.setItem(modal_id, now);
      // open modal
      showModal();
    } else {
      // check if rested after 2 minutes    
      modal.style.opacity = '0.0001';
      if (now - LSMODAL >= 30000) {
        // show modal
        showModal();
        // set new time
        localStorage.setItem(modal_id, now);
        return;
      }
      closeModal();
    }
  }

  setTimeout(() => {
    document.querySelector('.close-modal').style.display = 'block';
  }, 3000);
})();
