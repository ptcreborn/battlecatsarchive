
// Made for 3 days
// April 2, 2026

//   <div data="Little Chat" style="
//     border: 1px solid black;
//     background: beige;
//     margin-top: 30px;
// ">
//   <h4 style="padding-left: 10px; padding-top: 5px;">Online Chat</h4>
// <div id='bca_parent_chat_container' style="
//     display: block;
//     height: 500px;
//     border: 1px solid #a7a7a7;
//     min-height: 50px;
//     max-height: 500px;
//     overflow: auto;
// 	opacity: 0.7;
// 	pointer-events: none;
// "><button id='chat_load_more' style="
//     width: 100%;
//     border: 1px solid #b7b7b7;
// ">Load more comments</button><div id='bca_chat_box_container'  style="
//     border: 1px solid #dadada;
//     display: flex;
//     align-items: center;
//     flex-direction: column;
//   	justify-content: flex-end;
// ">
//   </div></div>
// <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6102173297126028"
//      crossorigin="anonymous"></script>
// <!-- chat_box -->
// <ins class="adsbygoogle"
//      style="display:inline-block;width:100%;height:90px"
//      data-ad-client="ca-pub-6102173297126028"
//      data-ad-slot="4485715150"></ins>
// <script>
//      (adsbygoogle = window.adsbygoogle || []).push({});
// </script>
// <form id='form_bca_chat_box' style="
//     display: flex;
//     align-items: center;
//     min-height: 50px;
//     border: 1px solid red;
//     opacity: 0.7;
//     pointer-events: none;
// " data-gtm-form-interact-id="0">
//   <img chat-editor-prof="" loading="lazy" style="
//     width: 30px !important;
//     height: 50px !important;
//     object-fit: cover;
//     align-self: flex-start;
// "><textarea id='bca_chat_content' type="text" required="" placeholder="Type something..." style="
//     resize: none;
//     width: 100%;
//     height: 50px;
//     flex: auto;
// " data-gtm-form-interact-field-id="0"></textarea>
// <button type='button' id='bca_submit_chat' style="
//     flex: 1 1 70px;
//     height: 50px;
//     align-self: flex-end;
//     border: 1px solid #d0d0d0;
//     min-width: 50px;
// ">Send</button></form>
// </div>

(async () => {
    let user_email = '';
    let username = '';
    let user_prof = '';
    let user_rank = '';
    let page = 0;
    let loc_data;
    let myWorker;

    const sendBtn = document.getElementById('bca_submit_chat');
    const loadMoreBtn = document.getElementById('chat_load_more');
    const container = document.getElementById('bca_parent_chat_container');

    await initialize();

    async function initialize() {
        let templateStr = `
<template chat-box-item-container>
    <div style="
    border: 1px solid #dadada;
    display: flex;
    align-items: center;
    width: 100%;
"><div style="
    flex: 0 0 50px;
    margin: 5px;
    align-self: flex-start;
    height: 50px;
"><img chat-profile-image alt="user profile image" loading="lazy" src style="
    width: 50px !important;
    height: 50px !important;
    object-fit: cover;
"></div><div style="
    flex: 1 1 auto;
    padding: 3px;
    line-height: .9rem;
    overflow: hidden;
           /* Legacy support */
        /* Modern standard */
           /* Specific to webkit to prevent overflow */
            /* Preserves line breaks from the user input */
"><a target='_blank' chat-username="" style="
    font-size: 10px;
"></a>
      <br/><p chat-data-content style="margin: 0;
    font-size: 13px;
"></p><a target='_blank' style='font-size: 11px;' chat-from-source></a><div style="
    align-self: flex-start;
    display: flex;
    flex-wrap: wrap;
    margin-right: 5px;
    align-items: center;
    justify-content: flex-end;
"><div style="
    font-size: 10px;
    line-height: 1rem;
    display: inline-block;
"></div>
      <span style="
    opacity: 0.7;
    font-weight: 600;
    font-size: 11px;
    line-height: 1rem;
" chat-timeago=""></span>
       <span style="
    margin-left: auto;
    opacity: 0.7;
    font-weight: 600;
    font-size: 11px;
    line-height: 1rem;
" loc-data=""></span>
      <img loading="lazy"
	chat-level style="
    width: 20px;
    height: 20px;
    object-fit: cover;
    margin-left: 5px;
"><img loading="lazy" chat-country style="
    width: auto;
    height: 15px;
    object-fit: cover;
    object-position: center;
" onerror="this.onerror=null; this.src='https://i.imgur.com/4kUQpfl.png';"></div></div></div>
</template>`;

        let div_template = document.createElement('div');
        div_template.innerHTML = templateStr;

        document.querySelector('body').appendChild(div_template);

        appendJSFile('https://cdn.jsdelivr.net/npm/moment@2.30.1/moment.min.js');

        user_email = await checkSession();

        // Workers Area \\
        let workerStr = `import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://jyqsbxypqjsjwfwpvkhn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5cXNieHlwcWpzandmd3B2a2huIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Njg1NzUsImV4cCI6MjA2MzI0NDU3NX0.MAY3ZEdU3V33Iq802b1PtZDqL31xPdoC6xe_ybmnrps';

if (!self.supabase)
    self.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

self.onmessage = async (e) => {
    let payload = e.data;
    let command = payload.command;

    // importing supabase
    // If using a CDN (Module Worker)

    switch (command) {
        case "GET_CHATS_ITEMS": {
            let page = payload.page;
            let PAGE_SIZE = payload.pagesize;

            let { data, error } = await self.supabase.from('widget-chat-box').select('*, users(username, prof_img, email, ranks(rank_image))')
                .order('date', { ascending: false })
                // 2. Grab the first chunk of that ordered list
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (error) {
                self.postMessage({
                    status: command,
                    result: 'ERROR',
                    data: '\`Error in getting users data... \${error.message}\`'
                });
                return;
            }

            self.postMessage({
                status: command,
                result: 'SUCCESS',
                data: data,
                trigger: payload.trigger
            })
            break;
        }
        case "GET_USER_DATA": {
            let { data, error } = await self.supabase.from('users').select('id, username, ranks(rank_image), prof_img').eq('email', payload.email);

            if (error) {
                self.postMessage({
                    status: command,
                    result: 'ERROR',
                    data: '\`Error in getting users data... \${error.message}\`'
                });
                return;
            }

            self.postMessage({
                status: command,
                result: 'SUCCESS',
                data: data?.[0]
            });
            break;
        }
        case "SEND_CHAT": {
            let { error } = await supabase.from('widget-chat-box').insert(payload.chat_payload);

            if (error) {
                self.postMessage({
                    status: command,
                    result: 'ERROR',
                    data: '\`Error in getting users data... \${error.message}\`'

                });
                return;
            }

            self.postMessage({
                status: command,
                result: 'SUCCESS'
            })
            break;
        }
        case "GET_LOCATION": {
            try {
                const flagUrl = 'https://flagcdn.com/w80/' + payload.code.toLowerCase() + '.png';

                self.postMessage({
                    status: command,
                    result: 'SUCCESS',
                    flag: flagUrl, // This is now a URL to a PNG image,
                    selector: payload.selector
                });
            } catch (err) {
                self.postMessage({ result: 'ERROR', data: 'Failed to fetch location' });
            }
            break;
        }
        case "START_LISTENER": {
            self.supabase
                .channel('chat-listener-channel')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'widget-chat-box' }, payload => {
                    // Send the new data back to the main thread
                    self.postMessage({ status: 'NEW_COMMENT', result: "SUCCESSFUL", payload: payload.new });
                })
                .subscribe();
            break;
        }
    }
}`;

        myWorker = createWorker(workerStr);

        getUserInfo();
        retrieveChats(page, "INITIATE");
        startListening();
    }

    async function checkSession() {
        await initFunctions(['supabase']);

        let { data, error } = await supabase.auth.getSession();

        if (error || !data.session)
            return;

        return data.session.user.email;
    }

    function retrieveChats(page, trigger) {
        myWorker.postMessage({
            command: 'GET_CHATS_ITEMS',
            page: page,
            pagesize: 10,
            trigger: trigger
        });
    }

    function startListening() {
        myWorker.postMessage({
            command: 'START_LISTENER'
        })
    }

    function getUserInfo() {
        myWorker.postMessage({
            command: 'GET_USER_DATA',
            email: user_email
        });
    }

    function sendChat(data) {
        // check if the user is anon or not
        myWorker.postMessage({
            command: 'SEND_CHAT',
            chat_payload: data
        });
    }

    function getFLAG(selector, code) {
        myWorker.postMessage({
            command: 'GET_LOCATION',
            selector: selector,
            code: code
        });
    }

    async function getLocData() {
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();

            loc_data = data;
        } catch (error) {
            console.log(error);
        }
    }

    async function buildRecentChatHTML(chats_data) {
        await initFunctions(['moment']);
        const parent = document.getElementById('bca_chat_box_container');
        const fragment = document.createDocumentFragment();

        if (!chats_data)
            return;

        chats_data.forEach(item => fragment.append(appendChatItem(item)));

        parent.prepend(fragment);

        document.getElementById('bca_parent_chat_container').scrollTop = 0;
    }

    async function buildChatHTML(chats_data) {
        await initFunctions(['moment']);
        const parent = document.getElementById('bca_chat_box_container');

        if (!chats_data)
            return;

        chats_data.forEach(item => parent.prepend(appendChatItem(item)));

        document.getElementById('bca_parent_chat_container').scrollTop = document.getElementById('bca_parent_chat_container').scrollHeight;
    }

    function appendChatItem(item) {
        const template = document.querySelector('[chat-box-item-container]');
        const clone = template.content.cloneNode(true).children[0];

        // Filter whether the user is anonymous...
        clone.id = `chat-data-${item?.id || new Date().getTime()}`;

        clone.querySelector('[chat-profile-image]').src = `${item?.users?.prof_img ? `${item.users.prof_img}` : `https://i.imgur.com/4kUQpfl.png`}`;
        clone.querySelector('[chat-level]').src = `${item?.users?.ranks ? `${item.users.ranks.rank_image}` : `https://i.imgur.com/mVnjsYS.png`}`;
        clone.querySelector('[chat-username]').textContent = `@${item?.users ? `${item.users.username}` : `im noob, i cant create my own account.`}`;
        clone.querySelector('[chat-timeago]').textContent = `${item?.date ? `${moment(item.date).fromNow()}` : `${moment(new Date().getTime())}`}`;
        clone.querySelector('[chat-username]').href = user_email ? `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${user_email}` : `https://battlecatsarchive.blogspot.com/p/signin-to-bca.html`;
        clone.querySelector('[chat-data-content]').textContent = `${item?.content}`;
        clone.querySelector('[loc-data]').textContent = `${item?.city ? `${item.city}` : `Banana`}, ${item?.country_name ? `${item.country_name}` : `Universe`}`;

        clone.querySelector('[chat-from-source]').textContent = `/${item?.from_source ? `${JSON.parse(item.from_source).title}`: `${document.title}`}`;
        clone.querySelector('[chat-from-source]').href = `${item?.from_source ? `${JSON.parse(item.from_source).url}`: `${window.location.href}`}`;

        getFLAG(`#${clone.id} [chat-country]`, item?.country_code ? `${item.country_code}` : `US`);

        return clone;
    }

    myWorker.onmessage = async (e) => {
        let data = e.data;
        let status = data.status;
        let result = data.result;
        let isSubmitRegistered = false;
        let isLoadMoreRegistered = false;

        switch (status) {
            case "GET_USER_DATA": {
                if (result == "SUCCESS") {
                    const submit = document.getElementById('bca_submit_chat');

                    if (data.data) {// means registered 
                        document.querySelector('[chat-editor-prof]').src = `${data.data.prof_img}`;
                        username = data.data.username;
                        user_prof = data.data.prof_img;
                        user_rank = data.data.ranks.rank_image;
                    }
                    else // means anon
                        document.querySelector('[chat-editor-prof]').src = `https://i.imgur.com/eC4m6v4.png`;

                    if (!isSubmitRegistered) {

                        // SENDING CHAT!
                        submit.addEventListener('click', async () => {
                            if (!loc_data)
                                await getLocData();
                            disableElem(sendBtn);

                            if (document.querySelector('#bca_chat_content').value.trim().length == 0) {
                                window.alert('Type something before sending...');
                                enableElem(sendBtn);
                                return;
                            }
                            let chat_payload = {
                                user_id: data.data?.id,
                                content: document.querySelector('#bca_chat_content').value,
                                date: 'now()',
                                ip: loc_data.ip,
                                city: loc_data.city,
                                country_name: loc_data.country_name,
                                country_code: loc_data.country_code,
                                org: loc_data.org,
                                latitude: loc_data.latitude,
                                longitude: loc_data.longitude,
                                from_source: JSON.stringify({
                                    url: window.location.href,
                                    title: document.title
                                })
                            }
                            sendChat(chat_payload);
                        }, false);
                        isSubmitRegistered = true;
                    }

                    enableElem(document.getElementById('form_bca_chat_box'));
                }
                break;
            }
            case "GET_CHATS_ITEMS": {
                if (result == "SUCCESS") {
                    if (data.trigger == "INITIATE") {
                        enableElem(container);
                        buildChatHTML(data.data);
                        // add click listener to load more chats.
                        if (!isLoadMoreRegistered) {
                            loadMoreBtn.addEventListener('click', () => {
                                disableElem(loadMoreBtn);
                                retrieveChats(++page, "LOADMORE");
                            });
                            isLoadMoreRegistered = true;
                        }
                    }
                    else if (data.trigger == "LOADMORE") {
                        // will load more...
                        if (!data.data || data.data.length == 0) {
                            // means no more data to load, disabled loadmore btn
                            disableElem(loadMoreBtn);
                            loadMoreBtn.textContent = `Nothing more to load...`;
                            return;
                        }
                        buildRecentChatHTML(data.data);
                        enableElem(loadMoreBtn);
                    }
                }
                break;
            }
            case "SEND_CHAT": {
                if (result == "SUCCESS") {
                    // append the comment child here
                    enableElem(sendBtn);
                    document.querySelector('#bca_chat_content').value = ``;
                }
                break;
            }
            case "GET_LOCATION": {
                if (result == "SUCCESS")
                    document.querySelector(data.selector).src = data.flag;
                else
                    document.querySelector(data.selector).src = `https://i.imgur.com/mVnjsYS.png`;

                break;
            }
            case "NEW_COMMENT": {
                let new_payload = data.payload;
                const parent = document.getElementById('bca_chat_box_container');
                if (new_payload.user_id) {
                    // simplly retrieve the user info...
                    let { data, error } = await supabase.from('users').select('prof_img, username, ranks(rank_image)').eq('id', new_payload.user_id);

                    if (error || data?.length == 0) {
                        parent.appendChild(appendChatItem(new_payload));
                        return;
                    }

                    (new_payload.users ??= {}).prof_img = data[0].prof_img;
                    (new_payload.users ??= {}).username = data[0].username;
                    ((new_payload.users ??= {}).ranks ??= {}).rank_image = data[0].ranks.rank_image;

                    parent.appendChild(appendChatItem(new_payload));
                }
                else parent.appendChild(appendChatItem(new_payload));
                document.getElementById('bca_parent_chat_container').scrollTop = document.getElementById('bca_parent_chat_container').scrollHeight;
            }
        }
    }

    function createWorker(workerStr) {
        const blob = new Blob([workerStr], {
            type: "application/javascript"
        });
        const workerUrl = URL.createObjectURL(blob)
        const worker = new Worker(workerUrl, {
            type: 'module'
        });
        return worker;
    }

    function disableElem(elem) {
        elem.style.opacity = "0.7";
        elem.style.pointerEvents = 'none';
    }

    function enableElem(elem) {
        elem.style.opacity = "1";
        elem.style.pointerEvents = 'auto';
    }
})();
