(async () => {
    const user_info = document.getElementById('user_informations');
    const controls = document.getElementById('panelControls');
    let num_of_requests = 0;

    await initFunctions(['supabase']);
    let isViewingOtherProfile = true;
    let userSession = await getUserSession();
    let userEmail = await renderUserInfo(userSession); // [email, username]
    await renderAccountRequest();
    await rankUser();

    // PUBLIC FUNCTIONS
    window.logout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('user');
        window.location.href = `https://battlecatsarchive.blogspot.com/`;
    }

    window.request = async () => {
        window.location.href = `https://battlecatsarchive.blogspot.com/p/official-battle-cats-account-request.html`;
    }

    // document.querySelector('#btn_uploadProfile').addEventListener('click', () => {
    //     document.querySelector('#file_attachments').click();
    // });

    // ImgurJS.uploadImgUr('file_attachments', 'prof_img', () => {
    //     document.querySelector('#btn_uploadProfile').innerText = 'Uploading...';
    //     document.querySelector('#btn_uploadProfile').style.pointerEvents = 'none';
    //     document.querySelector('#btn_uploadProfile').classList.remove('main-button');
    // }, async () => {
    //     document.querySelector('#btn_uploadProfile').innerText = 'Change Profile Photo';
    //     document.querySelector('#btn_uploadProfile').style.pointerEvents = 'auto';
    //     document.querySelector('#btn_uploadProfile').classList.add('main-button');
    //     const {
    //         error
    //     } = await supabase.from('users').update({
    //         prof_img: document.querySelector('#prof_img').src
    //     }).eq('email', userEmail[0]);

    //     localStorage.setItem('user', btoa(JSON.stringify({
    //         email: userEmail[0],
    //         profile: document.querySelector('#prof_img').src
    //     })));

    //     document.querySelector('#bca_user img.home-profile').src = `${document.querySelector('#prof_img').src}`;

    //     if (error) {
    //         window.alert(`${error.message}, error has occured!'`);
    //         return;
    //     }
    // });

    // IMGBB as default image hosting...

    // FUNCTIONS
    async function renderAccountRequest() {
        const table = document.getElementById('requested_account_table');
        const table_body = table.querySelector('tbody');

        const user_id = await getUserID(userEmail[0]);
        // calling user records.
        let data = await supabase.rpc('get_user_account_requests', {target_user_id: user_id});
        if (!data?.data) {
            window.alert("No account history was seen from the user's record.");
            return;
        }

        data = data.data;

        if (isViewingOtherProfile) document.querySelector(`#othersProfile`).innerHTML = `⚠️You are viewing other's Profile⚠️`;
        else document.querySelector('#othersProfile').remove();

        data.forEach(element => {
            // NEW METHOD
            if (!element.code && element.bucket_id) {
                let bucket = element.bucket_id;
                let version = bucket.ver?.version;
                let lang = bucket.lang?.lang;
                let name = bucket.acc_id?.name;
                let ads = bucket.acc_id?.ads;
                let raw = `https://bca-image-proxy.jasonbourne181997.workers.dev${bucket.raw}`;
                let link = bucket.acc_id.link;

                table_body.innerHTML += `<tr>
				<td style="width: 20.7104%;">
				${!isViewingOtherProfile ?
                        `${!element.use ?
                            `<button class='tab' id="${element.id}" onclick="markUse(${element.use}, ${element.id});">Unused</button>` :
                            `<button class='tab disabled' id="${element.id}">Code Transferred</button>`}`
                        : `<button class='tab disabled'>Unavailable</button>`}</td>
				<td style="width: 22.2896%;"><a target='_blank' href='${link}'>${lang}-${version} (${name})</a></td>
				<td style="width: 20.7104%;">${moment(element.date).fromNow()}</td>
				<td style="width: 23%;">${ads}</td>
				${!isViewingOtherProfile ? `<td style="width: 24%;"><a target='_blank' href='https://battlecatsarchive.blogspot.com/p/image-viewer.html?view=${btoa(raw)}'><img src='${raw}'/></a></td>` : `<td style="width: 23%;">PRIVATE</td>`}
				</tr>`;
                return;
            }

            // OLD METHOD
            if (element.code) {
                let JSON_data = JSON.parse(atob(element.code));
                table_body.innerHTML += `<tr>
				<td style="width: 20.7104%;">
				${!isViewingOtherProfile ?
                        `${!element.use ?
                            `<button class='tab' id="${element.id}" onclick="markUse(${element.use}, ${element.id});">Unused</button>` :
                            `<button class='tab disabled' id="${element.id}">Code Transferred</button>`}`
                        : `<button class='tab disabled'>Unavailable</button>`}</td>
				<td style="width: 22.2896%;"><a href='https://battlecatsarchive.blogspot.com/p/official-battle-cats-account-request.html'>${JSON_data.name}</a></td>
				<td style="width: 20.7104%;">${moment(JSON_data.date).fromNow()}</td>
				<td style="width: 23%;">${JSON_data.progress}</td>
				${!isViewingOtherProfile ? `<td style="width: 24%;"><a target='_blank' href='https://battlecatsarchive.blogspot.com/p/image-viewer.html?view=${btoa(JSON_data.link)}'><img src='${JSON_data.link}'/></a></td>` : `<td style="width: 23%;">PRIVATE</td>`}
				</tr>`;
                return;
            }
        });

        table.style.display = 'block';

        window.markUse = async (isUsed, id) => {
            if (!isUsed) {
                let {
                    data,
                    error
                } = await supabase.from('account-requests').update({
                    use: true
                }).eq('id', id);
                if (error) {
                    window.alert(error.message);
                    return;
                }

                document.getElementById(`${id}`).classList.add('disabled');
                document.getElementById(`${id}`).innerText = "Code Transferred";
                document.getElementById(`${id}`).removeAttribute('onclick');
            }
        }
    }
    window.myCart = () => {
        window.location.href = `https://battlecatsarchive.blogspot.com/p/cart.html?user=${btoa(userEmail[0])}`;
    }
    async function renderUserInfo(userSession) {
        // check if requesting a profile view
        let url = window.location.href;
        let searchParams = new URL(url).searchParams;

        if (searchParams.get('view')) {
            // username is the key of the "View"
            let email = searchParams.get('view');
            const user_id = await getUserID(decodeURIComponent(email));
            let num_of_acc_requests_data = await supabase.from('account-requests').select('*', { count: 'exact', head: true }).eq('user_id', user_id);

            if (num_of_acc_requests_data.error)
                num_of_acc_requests_data.count = 0;

            num_of_requests = num_of_acc_requests_data.count;

            let {
                data,
                error
            } = await supabase.from('users').select(`*, ranks(rank_name, rank_image)`).eq('email', email).single();

            if (error) {
                window.alert("Error encountered: " + error.message);
                window.alert(`User with email: ${email} does not exist!`);
                // await supabase.auth.signOut();
                // localStorage.removeItem('user');
                window.location.href = `https://battlecatsarchive.blogspot.com/`;
            }

            if (!data) {
                window.alert(`The email return zero results and can't be viewed: (${email})`);
                // await supabase.auth.signOut();
                // localStorage.removeItem('user');
                window.location.href = `https://battlecatsarchive.blogspot.com/`;
            }

            // Getting country map and official name
            // let country_data = await fetch(`https://restcountries.com/v3.1/alpha/${data.country}`);
            // let country_flag, country_name;

            // if (country_data.status == 200) {
            //     country_data = await country_data.json();
            //     country_data = country_data[0];
            //     country_flag = country_data.flags.png;
            //     country_name = country_data.name.official;
            // } else {
            //     country_flag = `https://www.crwflags.com/fotw/images/q/qt%7Danon12.jpg`;
            //     country_name = `Homeless Catter`;
            // }

            let country_flag, country_name;

            if (data.country == "Anonymous") {
                country_flag = `https://www.crwflags.com/fotw/images/q/qt%7Danon12.jpg`;
                country_name = `Homeless Catter`;
            } else {
                country_flag = `https://flagsapi.com/${data.country.toUpperCase()}/shiny/64.png'`;
                country_name = `${data.country}`;
            }

            user_info.innerHTML = `<img id='prof_img' src="${data.prof_img == null ? `https://i.imgur.com/wpQrEpL.gif` : `${data.prof_img}`}" style="height: 100px; object-fit:cover; margin: 5px; width: 100px;" /><br/>
            <span><b>UserID</b>: ${data.id}</span><br />
            <span><b>Username</b>: ${data.username}</span><br />
            <span><b>Birthday</b>: ${moment(data.birthday).format('MMM. D, YYYY')} <b>(${moment(data.birthday).fromNow()})</b></span><br /><span><b>Gender</b>: ${data.gender == "M" ? "Male" : "Female"}</span><br />
            <span><b>Country</b>: <img alt='country' style='width: 30px; margin: 0px 5px; height: 20px; aspect-ratio: 1/1; object-fit: cover;' src='${country_flag}'/>${country_name}</span><br />
            <span><b>Rank</b>: <img style='width: 30px; margin: 0px 5px;height: 20px; object-fit: cover;' src='${data.ranks.rank_image}'/>${data.ranks.rank_name}</span><br/><span><b>Requested</b>: ${num_of_acc_requests_data.count} account${num_of_acc_requests_data.count > 1 ? `s` : ``} </span>`;


            if (!userSession) {
                // remove localstorage
                if (localStorage.getItem('user'))
                    localStorage.removeItem('user');
                // window.alert("Your session expired, please relogin.");
                // window.location.href = 'https://battlecatsarchive.blogspot.com/p/signin-to-bca.html';
                // return;
            } else if (userSession.user.email == email) {
                isViewingOtherProfile = false;
                controls.style.display = 'flex';
            }

            if (!isViewingOtherProfile) {
                localStorage.setItem('user', btoa(JSON.stringify({
                    email: email,
                    profile: `${data.prof_img == null ? `https://i.imgur.com/wpQrEpL.gif` : `${data.prof_img}`}`
                })));
                document.querySelector('#bca_user img.home-profile').src = data.prof_img == null ? 'https://i.imgur.com/wpQrEpL.gif' : data.prof_img;
            }


            document.title = `${data.username}'s Profile`;
            return [email, data.username];
        } else {
            window.alert(`Invalid user requests. The page cannot be viewed. Thank you.`);
            window.location.href = `https://battlecatsarchive.blogspot.com/`;
            return;
        }
    }
    async function getUserSession() {
        let {
            data,
            error
        } = await supabase.auth.getSession();

        if (error || !data) return;

        return data.session;
    }

    async function getUserID(email) {
        let { data, error } = await supabase.from('users').select('id').eq('email', email);
        if (data?.length == 0)
            return;

        if (error)
            return;

        return data[0].id;
    }

    const uploadInput = document.getElementById('file_attachments');
    const uploadBtn = document.getElementById('btn_uploadProfile');

    uploadBtn.addEventListener('click', () => {
        uploadInput.click();
    });

    uploadInput.addEventListener('input', async (e) => {
        await initFunctions(['BCA_IMGBB', 'BCA_Cache', 'BCA_Users', 'BCA_Notifications']);
        const file = e.target.files[0];
        BCA_IMGBB.initialize(uploadInput, uploadBtn);
        let image_data = await BCA_IMGBB.uploadImage(file);

        if (!image_data)
            return;

        // ON SUCCESS
        await supabase.from('users')
            .update({
                prof_img: BCA_IMGBB.getOriginal(image_data)
            })
            .eq('email', userEmail[0]);

        document.querySelector('#bca_user img.home-profile').src = BCA_IMGBB.getThumbnail(image_data);
        document.getElementById('prof_img').src = BCA_IMGBB.getOriginal(image_data);

        // REFRESH LOCAL STORAGE COOKIES
        let data = await BCA_Users.getUserInfo('email, username, prof_img, rank_id(rank_name)');

        if (!data)
            return;

        if (data.length === 1)
            data = data[0];

        BCA_Cache.setItemWithExpiration(BCA_Notifications.LOCALSTORAGE_USER, data, 600000);

        uploadInput.value = "";
    });

    async function rankUser() {
        if (isViewingOtherProfile)
            return;

        if (num_of_requests < 99) {
            await supabase.from('users').update({
                rank_id: 1
            }).eq('email', userEmail[0]);
            return;
        }

        let { data, error } = await supabase.from('ranks').select('id').lte('rank_range', 99).order('rank_range', { ascending: false }).limit(1).single();

        if (error)
            window.alert(`${error.message}`);

        await supabase.from('users').update({
            rank_id: data.id
        }).eq('email', userEmail[0]);
    }
    async function getRaw(bucket_id) {
        let { data, error } = await supabase.from('account_buckets').select('raw').eq('id', bucket_id);

        if (data?.length === 0 || error)
            return;

        return data.length === 1 ? data[0].raw : data;
    }
    async function getUserRequestHistory(user_id) {
        console.log(user_id);
        let { data, error } = await supabase.from('account-requests').select('id, date, code, use, bucket_id(raw, acc_id(name, ads, link), lang(lang), ver(version))').eq('user_id', user_id).order('date', { ascending: false });

        if (data?.length === 0 || error)
            return;

        console.log(data);

        return data;
    }
})();
