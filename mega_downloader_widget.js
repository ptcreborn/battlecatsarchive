(async() => {
    // LABEL must be no spaces.
    window.embedURLMega = async(mega_url, label) => {
        const mega_api = `https://unpkg.com/megajs/dist/main.browser-es.mjs`;
        const postBody = document.getElementById(`postBody`);

        let megaAPI = await
        import (mega_api);
    
        let embed_html = `
<div class="parent">
  <div class="child">
    <span id='${label}_filename'>Loading...</span>
    <span id='${label}_filesize' style="
    padding: 2px;
    border-radius: 5px;
">??? mb</span>
  </div>
  <div class="child">
    <progress id='${label}_progress' value="0" max="100" style="
    flex-grow: 1;
    background-color: beige;
    color: red;
    text-align: right;
    transition: width 0.4s ease;
    height: 30px;
    border: 1px solid darkgray;
">30%</progress>
    <button id='${label}_btn_download' style="   
    min-width: 100px;
    opacity: 0.5;
    pointer-events: none;
" class="main-button button">Download</button>
  </div>
  <div class="child">
<button id='${label}_btn_save' style="display: none; background: limegreen; font-size: 1rem; border: 1px solid rgba(0, 0, 0, 0.3); height: 30px; text-align: center; margin: 5px auto 0px; width: 100%; color: white; font-weight: 600;
">Save</button>
  </div>
</div>`;

        postBody.innerHTML += embed_html;
        await sleep(1000);
        
        const filename = document.getElementById(`${label}_filename`);
        const filesize = document.getElementById(`${label}_filesize`);
        const progress = document.getElementById(`${label}_progress`);
        const btn_download = document.getElementById(`${label}_btn_download`);
        const btn_save = document.getElementById(`${label}_btn_save`);

        const file = megaAPI.File.fromURL(`${mega_url}`);
        await initDownload();

        async function initDownload() {
            file.api.userAgent = null;
            await file.loadAttributes();

            filename.innerText = file.name;
            filesize.innerText = `${Math.floor(file.size / (1024 * 1024))} MB`;
            enableButton(btn_download);

            btn_download.addEventListener('click', async() => {
                btn_download.innerText = 'Downloading...';
                disableButton(btn_download);
                await startDownload();
            })
        }

        async function startDownload() {
            const stream = file.download((err, data) => {
                if (err) {
                    window.alert(`Error has been occured: ${err}`);
                    return;
                }
                btn_save.style.display = 'block';
                btn_save.addEventListener('click', async() => {
                    btn_save.innerText = "Saving...";
                    disableButton(btn_save);

                    // converting binary to blob
                    const blob = new Blob([data], { type: 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);
                    const atag = document.createElement('a');
                    atag.href = url;
                    atag.download = file.name;
                    document.querySelector('#postBody').appendChild(atag);
                    atag.click();

                    btn_save.innerText = "Saved!";

                    await sleep(800);
                    enableButton(btn_save);
                    btn_save.innerText = "Save Again.";
                    btn_save.style.background = "green";
                }, false);
            });

            stream.on('progress', info => {
                btn_download.innerText = Math.round((info.bytesLoaded / info.bytesTotal) * 100) + '%';
                progress.value = Math.round((info.bytesLoaded / info.bytesTotal) * 100);
            });

        }

        function disableButton(elem) {
            elem.style.opacity = '0.7';
            elem.style.pointerEvents = 'none';
        }

        function enableButton(elem) {
            elem.style.pointerEvents = 'auto';
            elem.style.opacity = '1';
        }
    }
})();
