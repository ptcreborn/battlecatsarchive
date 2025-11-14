
// November 14, 2025

(async () => {
        let url = window.location.href;
        url = new URL(url).pathname;		

        await checkUrlInSPDB();

        async function checkUrlInSPDB() {
            await initFunctions(['supabase', 'FirebaseModule', 'moment']);
            let {
                data,
                error
            } = await supabase.from('bca-website-posts').select('id').eq('url', url);
            if (error) {
                window.alert(error.message);
                return;
            }
            if (data.length == 0)
                return;
            const id = data[0].id;
            let comments_data = await supabase.from('bca-comments').select('fb_id, user_id(id, email, created_at, gender, prof_img, username, rank_id(rank_name, rank_image))').eq('bca_posts', id).order('date', {
                ascending: true
            });
            if (comments_data.error) {
                window.alert("Error in comments_data: " + comments_data.error.message);
                return;
            }
            const comment_count = document.querySelector('.all-comments');
            comment_count.innerText = `${comments_data.data.length > 1 ? `${comments_data.data.length} comments`: `${comments_data.data.length} comment`}`
            for (const comment of comments_data.data) {
                let fb_data = await FirebaseModule.fetchJSON(`https://storehaccounts-comments-default-rtdb.firebaseio.com/bca_comments/${comment.fb_id}/content.json`);

                if (fb_data.hasOwnProperty('val') || fb_data.hasOwnProperty('attachments'))
                    buildChildComment(comment, fb_data.val, fb_data.attachments, fb_data.reply_data);
                else
                    buildChildComment(comment, fb_data, null, null); // This is the older version....
            }
        }

        function buildChildComment(sp_data, fb_data, attachments, fb_reply) {
            // Needed variables...
            // Username
            // Account Creation Date
            // Profile Image
            // Rank Name
            // Rank Image
            // Comment Content
            // Comment Date

            let img_html = '';

            if (attachments) {
                attachments.forEach(item => {
                    let img = document.createElement('img');
                    img.src = item;
                    img_html += img.outerHTML;
                });
            }

            let comment_reply_data = '';
            if (fb_reply == null)
                comment_reply_data = '';
            else {
                try {
                    comment_reply_data = JSON.parse(fb_reply);
                } catch (e) {
                    comment_reply_data = fb_reply;
                }
            }

            let html = `<div id=${sp_data.fb_id} class='comment-child'>
		<div class='left-bar'>
			<img class='profile'
			src='${sp_data.user_id.prof_img}' />
			<a href='https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${sp_data.user_id.email}'><b username id=${sp_data.user_id.id}>${sp_data.user_id.username}</b></a>
			<div class="achievements">
			<span>${sp_data.user_id.rank_id.rank_name}</span><img class="icon" loading="lazy"
				src="${sp_data.user_id.rank_id.rank_image}">
			</div>
			<div class="achievements">
			<span>${moment(sp_data.user_id.created_at).fromNow()}</span><span>${sp_data.user_id.gender === "M" ? `🙍🏻‍♂️`: `👧`}</span>
			</div>
		</div>
		<div class='right-bar'>				
			${comment_reply_data.hasOwnProperty('comment_id') ? 
					`<div style="background:beige;padding: 10px; border-radius: 10px; border: 2px solid wheat; margin: 10px 0;">${comment_reply_data.html}<span>${document.getElementById(comment_reply_data.comment_id).querySelector('[comment-data]').innerText}</span></div>`: comment_reply_data}
			<div>
				<span comment-data>${fb_data}</span>
				<div style='display: block; text-align: right;'>
    				<b class="time">${moment(sp_data.fb_id).fromNow()}</b>
				</div>
			</div>
			<div class='attachments'>
                ${img_html}
            </div>
			<button class='main-button button' onclick='replyFunc(this.parentNode.parentNode.id)'>Reply</button>
		</div>
		</div>
        <div style='width: 100%;' id='comment-form-attached-${sp_data.fb_id}'></div>`;

            document.getElementById('parent_container_comment').innerHTML += html;
        }

        window.replyFunc = async function(id) {
            await onReply(id);
        }

        async function onReply(id) {
            //append comment form editor in the id comment-form-attached
            //change the comment form editor placeholder into replying to...
            //gather all parameters...

            const comment_form = document.getElementById('comment_form');
            const comment_id = document.getElementById(id);
            const comment_element = document.getElementById('comment-form-attached-' + id);
            const user_id = comment_id.querySelector('b').id;
            const username = comment_id.querySelector('b').innerText;

            comment_element.appendChild(comment_form);
            await scrollToElemID(id);

            if (comment_form.getAttribute('login-status') == "failed") return;

            document.getElementById('reset-comment-form').style.display = 'block';
            document.getElementById('cancel-reply-btn').style.display = 'flex';

            comment_form.querySelector('textarea').placeholder = `Replying to @${username}`;

            comment_form.setAttribute('reply-data', JSON.stringify({
                comment_id: id,
                html: `<div style="height: fit-content; margin-top: 5px;">
				<button onclick='scrollToElemID(${id})'>
				Replied to <b>@${username}</b></button>
			</div>`
            }));

            // Notifications for the next step...
        }

        window.scrollToElemID = async function(id) {
            await sleep(100);
            document.getElementById(id).scrollIntoView({
                behavior: 'auto',
                block: 'center',
                inline: 'center',
            });
            document.getElementById(id).style.background = `beige`;
            await sleep(1500);
            document.getElementById(id).style.background = `white`;
        }

        // MISC Functions	
        async function initFunctions(dependencies) {
            for (let i = 0; i < dependencies.length; i++)
                await waitFunctionsGetDefined(dependencies[i]);
        }
        async function waitFunctionsGetDefined(funcName) {
            return new Promise(async (resolve) => {
                while (true) {
                    try {
                        funcName = eval(funcName);
                        resolve(funcName);
                        break;
                    } catch (e) {
                        await sleep(1000);
                    }
                }
            });
        }
        async function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    })();
