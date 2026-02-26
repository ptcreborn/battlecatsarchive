(async () => {

	// Created by Lem for Storehaccounts community
	// February 26, 2026
	// Serves to build all the comments within the requested thread.
	
	await initFunctions(['moment', 'supabase']);
    await getComments();

    async function getComments() {
        // check the id of the thread
        let threadID = atob(getThreadID());

        if (!threadID) {
            window.alert('Invalid Thread ID.');
            return;
        }
        await getCommentCount(threadID);
        let comments_data = await getCommentsData(threadID);

        for (const item of comments_data) {
            await buildCommentData(item);
        }
    }
    async function getCommentsData(threadID) {
        let { data, error } = await supabase.from('sth_comments').select('*, user_id(username, prof_img, email, ranks(rank_name, rank_image), country)').eq('thread_id', threadID).order('id', { ascending: true });

        if (error) {
            window.alert(`${error.message}`);
            return;
        }

        return data;
    }
    async function getCommentCount(threadID) {
        let data = await supabase.from('sth_comments').select('*', {
            count: 'exact',
            head: 'true'
        }).eq('thread_id', threadID);

        query('thread-comment-count').innerText = data.count > 1 ? `${data.count} comments` :
            `${data.count} comment`;
    }
    async function buildCommentData(item) {
        let image_data = [];
        let image_html = '';
        let comment_reply_html = '';

        if (item.images) {
            await initFunctions(['FirebaseModule']);
            image_data = await FirebaseModule.get(`https://storehaccounts-website-default-rtdb.firebaseio.com/sth_community_images/comments/${item.images}.json`);
            if (image_data) {
                JSON.parse(image_data).forEach(element => {
                    image_html += `<img src='${element}' class='glow-border unclicked' onclick='magnifyImage(this)'/>`;
                });
            }
        }

        if (item.reply_id) {
            // means this comment is a reply, embedding the comment its pointing to.			
            let comment_data = await supabase.from('sth_comments').select('description, user_id(prof_img, username)').eq('id', item.reply_id).single();

            if (comment_data.error) {
                window.alert(`Error occured in retrieving comment data: ${comment_data.error.message}`);
                return;
            }

            comment_data = comment_data.data;

            comment_reply_html = `<div class="ui message warning" style="margin: 0;display: flex; padding: 5px;"><div style="min-width: 35px;"><img class="icons" src="${imgUrMinify(comment_data.user_id.prof_img)}" style="display: block !important;"></div><div style="width: calc(100% - 35px); padding: 0 5px;"><i onclick="scrollToComment('ptc-child-comment-${item.reply_id}')" class="share icon" style="float: right;cursor: pointer;"></i><span style="display: block;">${comment_data.user_id.username} said: </span>${comment_data.description.substring(0, 300)}...</div></div>`;
        }

        document.getElementById('ptc_comment_container').innerHTML += `<div id='ptc-child-comment-${item.id}' class="notification-container-comments ui segment yellow" style="background: #22042a; margin: unset; padding: 5px;">
<img class="icons" src="${imgUrMinify(item.user_id.prof_img)}" thread-user-img="">
<span class="notification-date" thread-time-ago="">${parseDate(item.date)}</span>
<span class="footer" thread-user-name="">${item.user_id.username}</span>&nbsp;
				<span class="footer" thread-action="">${item.reply_id ? `replied to a comment`: `commented`}</span>...${comment_reply_html}
				<span style="display: block;" thread-comments="">${item.description}</span><div>${image_html}</div>
<span thread-country=""><img class="footer-imgs" src="${item.user_id.country == "Anonymous" ? ` https://static.wikia.nocookie.net/361735c0-7535-4dfe-b5d7-6f1683b4550b/scale-to-width/755`: `https://flagcdn.com/w320/${item.user_id.country.toLowerCase()}.png`}">
<span class="footer">${item.user_id.country == "Anonymous" ? `Homeless Catter`: `${await getCountryName(item.user_id.country)}`}</span>
</span>&nbsp;
				<span thread-rank=""><img class="footer-imgs" src="${imgUrMinify(item.user_id.ranks.rank_image)}">
<span class="footer">${item.user_id.ranks.rank_name}</span>
</span>
<button style="margin-right: 15px;border: 1px solid #9b9a9a;font-weight: 400;font-size: 0.8rem;" thread-reply="" onclick="appendEditor(this)">Reply</button><br>
</div>`;

	}
	function getThreadID() {
		return new URL(window.location.href).searchParams.get('thread');
	}
	function query(str) {
		return document.querySelector(`[${str}]`);
	}
	function parseDate(date) {
		return moment(date).fromNow();
	}
	window.magnifyImage = (image) => {
		image.classList.add('magnify');
		image.classList.remove('unclicked');
		image.src = image.src.replace('b.', '.');
		image.src = image.src.replace('s.', '.');
	}
	async function getCountryName(country_code) {
			let country = await fetch(`https://restcountries.com/v3.1/alpha/${country_code}`)
			.then(res => res.json())
			.then(data => {
				return data[0].name.official
			});
			return country;
	}
	window.scrollToComment = async (id) => {
		let element = document.getElementById(id);
        element.scrollIntoView({
            block: "center",
            behavior: "smooth"
        });
		
		element.classList.add('comment-selected');
		element.style.background = '#34300d';
		await sleep(2000);
		element.classList.remove('comment-selected');
		element.style.background = '#22042a';
    }
	function imgUrMinify(url) {
		const imgurSuffixes = ['', 's', 'b', 't', 'm', 'l', 'h'];
		const imgUrl = 'https://i.imgur.com/';
		let filename = url.split(imgUrl)[1].split('.')[0];
		let extension = url.split(imgUrl)[1].split('.')[1];

		if(imgurSuffixes.includes(filename.substring(filename.length-1, filename.length)))
			return url	
		else return `${imgUrl}${filename}s.${extension}`;
	}
})();
