// This will be the main comment function for displaying the comment editor if its not a web page.
// This holds the html of both the comment viewer and comment editor.

(() => {
    const comment_container = document.querySelector('.comment-contentl');
    const comment_parent = document.querySelector('div.comment-form');
    const comment_btn = document.getElementById('show-comment-form');

    comment_btn.style.display = 'none';    
    comment_parent.style.display = 'block';
    comment_parent.innerHTML = `<div id='parent_container_comment' class='comment-parent'></div>
<button onclick='restoreComment();' class="main-button button" style="display: none; width: 100%;" id="reset-comment-form">Add Comment</button><form class='inactive-form' id='comment_form' action='javascript:submit();'>
  <textarea placeholder='Type comment here...' style='width: 100%; height: 300px;' required></textarea>  
  <div id='img_attachments' class='attachments'></div>
  <div class="comment-tools-options">
    <button type="submit"><img src=""><div style="display: block; text-align: left;">Comment as<u><br><span></span></u></div></button>
    <input
    style="display: none;"
    id="file_attachments"
    type="file"
    accept="image/png, image/gif, image/jpeg, image/bmp"
    placeholder="Change Profile Picture" />
    <button id="btn_uploadImage" type="button"><img src="https://png.pngtree.com/png-vector/20190508/ourmid/pngtree-upload-cloud-vector-icon-png-image_1027251.jpg">Upload Image</button>
  </div>
  <button onclick='restoreComment();' id="cancel-reply-btn" type="button" style="display: none;"><img src="https://img.icons8.com/color/512/cancel--v3.png">Cancel Reply</button>
</form>`;
    comment_container.style.display = 'block';
})();
