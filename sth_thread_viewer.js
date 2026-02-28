(async() => {
	// Created by Lem for Storehaccounts community
	// February 26, 2026
	// Build the thread in the page.
	
    // variables
    let title = document.querySelector('[thread-title]');
    let timeago = document.querySelector('[thread-timeago]');
    let userlink = document.querySelector('[thread-userlink]');
    let username = document.querySelector('[thread-username]');
    let userprof = document.querySelector('[thread-userprof]');
    let userrank = document.querySelector('[thread-userrank]');
    let userage = document.querySelector('[thread-userage]');
    let badges = document.querySelector('[thread-badges]');
    let description = document.querySelector('[thread-description]');
    let images = document.querySelector('[thread-images]');

    // get the data from thread or requested url
    await getThreadData();

    async function getThreadData() {
        await initFunctions(['supabase']);

        // check for the url request.
        let thread_id = new URL(window.location.href).searchParams.get('thread');

        try {
            thread_id = atob(thread_id);
        } catch (error) {
            window.alert(`Error detected decrypting link: ${error}`);
            return;
        }

        // get the id from the supabase
        let {data, error} = await supabase.from('sth_threads').select('*').eq('id', thread_id).single();
        
        if(error) {
            window.alert(`Error getting thread data: ${error.message}`);
            return;
        }

        query('thread-parent').id = thread_id;

        // get user details
        let user_data = await supabase.from('users').select('username, email, prof_img, created_at, rank_id(rank_name, rank_image), country').eq('id', data.user_id).single();

        if(user_data.error) {
            window.alert(`Error detected in getting user info: ${user_data.error.message}`);
            return;            
        }

        user_data = user_data.data;

        title.innerText = data.title;
        timeago.innerText = `${await getTime(data.date)}`;
        userlink.href = `https://battlecatsarchive.blogspot.com/p/profile-page.html?view=${user_data.email}`;
        username.innerText = user_data.username;
        userprof.src = imgUrMinify(user_data.prof_img);
        userrank.innerText = `Rank: ${user_data.rank_id.rank_name}`;
        userage.innerText = `Joined: ${await getTime(user_data.created_at)}`;
        description.innerText = data.description;

        // do images and badges here...
        // extracting image from firebasemodule

        if(data.images) {
            await initFunctions(['FirebaseModule']);
            let image_data = await FirebaseModule.get(`https://storehaccounts-website-default-rtdb.firebaseio.com/sth_community_images/threads/${data.images}.json`);
            image_data = JSON.parse(image_data);
            image_data.forEach(element => {
                let temp_img = document.createElement('img');
                temp_img.src = element;
                temp_img.classList.add('unclicked');
                temp_img.addEventListener('click', (event) => {                    
                    event.currentTarget.classList.add('magnify');
                    event.currentTarget.classList.remove('unclicked');
                    event.currentTarget.src = event.currentTarget.src.replace('b.', '.');
                    event.currentTarget.src = event.currentTarget.src.replace('s.', '.');
                });
                images.appendChild(temp_img);
            });
        }

        // badges here get the country and rank
        let country_img = document.createElement('img');        
        let rank_img = document.createElement('img');
        
        country_img.src = `${user_data.country == "Anonymous" ? `https://i.ibb.co/VpHBRVpr/image.png` : `https://flagcdn.com/w320/${user_data.country.toLowerCase()}.png`}`;
        rank_img.src = `${imgUrMinify(user_data.ranks.rank_image)}`;

        badges.appendChild(country_img);
        badges.appendChild(rank_img);             
    }

    function query(attrib) {
        return document.querySelector(`[${attrib}]`);
    }

    async function getTime(date) {
        await initFunctions(['moment']);
        return moment(date).fromNow();
    }	

    function imgUrMinify(url) {
		const imgurSuffixes = ['', 's', 'b', 't', 'm', 'l', 'h'];
		const imgUrl = 'https://i.imgur.com/';
        
        if(!imgUrl.includes(url))
            return;

		let filename = url.split(imgUrl)[1].split('.')[0];
		let extension = url.split(imgUrl)[1].split('.')[1];

		if(imgurSuffixes.includes(filename.substring(filename.length-1, filename.length)))
			return url	
		else return `${imgUrl}${filename}s.${extension}`;
	}
})();
