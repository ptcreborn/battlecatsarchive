// POST CREATOR TICKET CREATOR

(async () => {
    let user_email = await checkUserLoggedin();
    let yt_urls = [];

    if (!user_email) {
        window.alert("User is not logged in. Please log in first.");
        window.location.href = `https://battlecatsarchive.blogspot.com/p/signin-to-bca.html`;
        return;
    }

    await initUploadImage();
    await addYoutube();

    async function checkUserLoggedin() {
        await initFunctions(['supabase']);

        let { data, error } = await supabase.auth.getSession();

        if (error || !data?.session)
            return;

        return data.session.user.email;
    }

    async function initUploadImage() {
        appendJSFile('https://rawcdn.githack.com/ptcreborn/battlecatsarchive/31fba5b4968ddd3edf3a690e2de7046bb8f6a701/ImgurJS.js');

        const uploadImg = document.getElementById('uploadImg');
        const input = document.getElementById('file_attachments');

        uploadImg.addEventListener('click', () => input.click());
        await initFunctions(['ImgurJS']);

        ImgurJS.uploadMultipleImgs('file_attachments', 'attachment',
            () => {
                uploadImg.textContent = `Uploading...`;
                uploadImg.style.opacity = `0.7`;
                uploadImg.style.pointerEvents = `none`;
            },
            () => {
                enableRemoveAttach();
                uploadImg.textContent = `Upload Image`;
                uploadImg.style.opacity = `1`;
                uploadImg.style.pointerEvents = `auto`;
            },
            () => {
                console.log('Upload error.');
                uploadImg.textContent = `Upload Image`;
                uploadImg.style.opacity = `1`;
                uploadImg.style.pointerEvents = `auto`;
            }
        );
    }

    function enableRemoveAttach() {
        const attach = document.getElementById('attachment');
        const remove = document.getElementById('remove_attach');
        if (attach.children.length === 0) remove.style.display = 'none';
        else remove.style.display = 'block';
    }

    document.getElementById('remove_attach').addEventListener('click', () => {
        const attach = document.getElementById('attachment');
        const remove = document.getElementById('remove_attach');

        if (attach.children.length > 0) {
            attach.lastElementChild.remove();
            yt_urls.pop();
        }

        if (attach.children.length === 0)
            remove.style.display = 'none';
    });

    async function addYoutube() {
        document.getElementById('btn_youtube').addEventListener('click', () => {
            let yt_url = window.prompt("Please add link url. (Ex. Youtube, Reddit, Etc.)");

            if (!yt_url)
                return;

            try {
                new URL(yt_url);
            } catch (error) {
                window.alert("Invalid URL");
                return;
            }

            // if (!isYouTubeUrl(yt_url)) {
            //     window.alert("Invalid YT Url. Please try again");
            //     return;
            // }

            if (yt_urls.includes(yt_url)) {
                window.alert("YT Link already added!");
                return;
            }

            yt_urls.push(yt_url);
            let div = document.createElement('a');
            div.innerHTML = isYouTubeUrl(yt_url) ? `📹 YT #${yt_urls.length}` : `Link #${yt_urls.length}`;
            div.href = yt_url;
            div.setAttribute('target', '_blank');
            document.getElementById('attachment').appendChild(div);

            enableRemoveAttach();
        });
    }

    function isYouTubeUrl(yt_url) {
        return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(yt_url);
    }

    window.submitTicket = async () => {
        if (!user_email)
            return;

        document.getElementById('submit').textContent = `Submitting...`;

        const submit = document.getElementById('myform');
        submit.style.opacity = '0.7';
        submit.style.pointerEvents = 'none';

        let key = await getContentJSON();
        let user_id = await getUserID();

        let { error } = await supabase.from('bca-ticket').insert({
            date: 'now()',
            title: document.getElementById('title').value,
            fb_id: key,
            user_id: user_id
        });

        if (error) {
            window.alert(`Error: ${error.message}`);
            submit.style.opacity = '1';
            submit.style.pointerEvents = 'auto';
            return;
        }

        window.location.href = `https://battlecatsarchive.blogspot.com/p/ticket-viewer.html?ticket=${key}`;
    }

    async function getUserID() {
        let { data, error } = await supabase.from('users').select('id').eq('email', user_email).single();

        if (error) {
            window.alert("There's no id particular to email: " + user_email);
            return;
        }

        return data?.id;
    }

    async function getContentJSON() {
        // post to Firebase First
        const db = `https://storehaccounts-notifications-default-rtdb.firebaseio.com/bca-tickets.json`;

        appendJSFile('https://rawcdn.githack.com/ptcreborn/storehaccounts/93f717900b4c70ddfee58d8ff9a89d323493ed61/FirebaseModule.js');

        await initFunctions(['FirebaseModule']);

        let yt_data = [];
        let link_data = [];
        let img_data = [];

        const img_attach = document.querySelectorAll('#attachment img');
        const yt_attach = document.querySelectorAll('#attachment a');

        Array.from(img_attach).map(item => {
            img_data.push(item.src.replace('b.', '.'));
        });

        Array.from(yt_attach).map(item => {
            if (isYouTubeUrl(item.href))
                yt_data.push(item.href);
            else 
                link_data.push(item.href);
        });

        const key = new Date().getTime();
        let cleanData = getCleanData(document.getElementById('content').value);

        await FirebaseModule.patch(db, JSON.stringify({
            [key]: {
                content: cleanData,
                img: img_data,
                yt: yt_data,
                link: link_data
            }
        }));

        return key;
    }

    function getCleanData(rawText) {
        // Replace 3 or more consecutive newlines with exactly 2
        // This keeps a nice "double space" between paragraphs but kills the rest
        const cleanedText = rawText.replace(/\n{3,}/g, '\n\n');

        return cleanedText;
    }
})();
