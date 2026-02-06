var DiscordAPI = {
    post: async function(username, avatar, title, message, thumbnail, url) {
        try {
            const response = await fetch('https://discord.com/api/webhooks/1469281796368765192/dZEs_0S3SUSr3Lza8EHN3_glyLdU-o7KAyTVrvFbIWhXtYXuKFdaUHlElO6ZOlwoA3-X', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    avatar_url: avatar,
                    "embeds": [{
                        "title": title,
                        "description": message,
                        "color": 3447003,
                        "image": {
                            url: `${thumbnail == '' ? 'https://i.ibb.co/B50ZrRQm/image.png': thumbnail}`
                        },
                        url: `${url == '' ? 'https://battlecatsarchive.blogspot.com/' : url}`
                    }]
                })
            });

            if (response.ok) { // Check if the response status is 200-299
                console.log('Message sent successfully!');
            } else {
                const errorText = await response.text();
                console.error(`Error sending message: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Network or fetch error:', error);
        }
    }
}
