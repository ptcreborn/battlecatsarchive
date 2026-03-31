(async () => {

    // DONE March 30, 2026, 2 WEEKS!
    // MAIN TRIGGER FOR BCA OFFICIAL COMMENT EDITOR

    // Check whether if the page is a POST. Also check for existing elements if exists
    let comment_top_count_snippet = document.querySelector('.comment-bubble');
    let comment_bottom_count_snippet = document.querySelector('.comment-contentl');
    let comment_parent_container = document.querySelector('div.comment-form');

    if (!comment_top_count_snippet || !comment_bottom_count_snippet || !comment_parent_container)
        return;

    comment_parent_container.style.display = 'block';
    comment_bottom_count_snippet.style.display = 'block';

    // Original containers
    let temp_container = document.createElement('div');
    temp_container.innerHTML = `<template comment-wrapper-template>
  <div class="bca-comment-wrapper">
    <article class="bca-desc-box">
      <header class="bca-desc-header">
        <a title='User Profile Page' class="bca-desc-avatar-wrap">
          <img src="https://i.imgur.com/6GyibCi.jpeg" alt="Cat Icon" class="bca-desc-avatar">
        </a>
        <div class="bca-desc-title-group">
          <span class="bca-desc-rank">Li'l Cat</span>
          <span class="bca-desc-name">jasonbourne</span>
          <span class="bca-desc-rarity">Normal Cat</span>
        </div>
        <div class="bca-desc-stats">
          <span class='bca-desc-xp'></span>
          <span class='bca-desc-lvl'></span>
        </div>
      </header>
      <div class="bca-desc-content">
        <div class="bca-desc-text">
        </div>
      </div>
      <footer class="bca-desc-footer">
        <button class="bca-btn-reply">Reply</button>
        <button class="bca-btn-reply bca-btn-role">Member</button>
        <button class="bca-btn-timeago"></button>
        <button class="bca-btn-replies">10 replies</button>
      </footer>
    </article>
  </div>
</template>
<template reply-widget-template>
<div class="bca-reply-widget-container alert-message warning"><div
        class="bca-reply-widget-heading">Replied: <span
            class="bca-reply-widget-username"></span>

        <img loading='lazy' src="https://i.imgur.com/6GyibCi.jpeg"
            class="bca-reply-widget-profimg">
    </div><div class="bca-reply-widget-content"></div></div>
</template>
        <button class='bca-btn-add-comment' id='trigger_comment_editor'>Loading Comment Editor...
        </button>
        <div id='bca_comment_editor' class="bca-archive-comment-container">
        </div>
        <section class="bca-comment-section">
        </section>
        <button class='bca-btn-add-comment' style='opacity: 0;' id='trigger_load_comments'>Load Comments
        </button>`;

    comment_parent_container.innerHTML = ``;
    comment_parent_container.appendChild(temp_container);

    let isTriggered = false;

    triggerCommentEditor();
    triggerCommentViewer();

    async function triggerCommentEditor() {
        let editor_btn = document.getElementById('trigger_comment_editor');
        const editor = document.getElementById('bca_comment_editor');
        document.querySelector('.bca-btn-add-comment').textContent = 'Add Comment';
        document.querySelector('.bca-btn-add-comment').style.display = 'block';
        document.querySelector('.bca-btn-add-comment').style.opacity = '1';
        comment_parent_container.addEventListener('click', (e) => {
            if (e.target.matches('#trigger_comment_editor')) {
                if (!isTriggered) {
                    appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/84da4f3ac2c83a947753c336a0fb6fe7edb1fa15/bca-official-comment-editor.js');
                    isTriggered = true;
                    return;
                }
                if (document.querySelector('.bca-comment-editor')) {
                    document.querySelector('.bca-comment-editor').classList.remove('bca-reply-mode');
                    document.querySelector('.bca-editor').setAttribute('placeholder', `Discuss something with this topic...`);
                    document.getElementById('bca_action_status').textContent = `Add a comment`;
                    editor.removeAttribute('data-parentid');
                    editor.removeAttribute('data-rootid');
                }
                editor_btn.after(editor);
            }
        });
    }

    function triggerCommentViewer() {
        setTimeout(() => {
            appendCSSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/fe2291a6666ee8e2b09714e1d3bd5ef4d42fbfdd/bca-comment-viewer.css');
            appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/4254b0ce9db924e306d126d0b766edb4d5cbf0ab/bca-official-comment-viewer.js');
        }, 1);
    }
})();
