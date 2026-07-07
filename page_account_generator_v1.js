(async () => {
    // decode the b64
    // create <p> tags
    // create <img> tags

    const info = document.getElementById('info');
    let url = window.location.href;
    let params = new URL(url).searchParams;

    let decoded_link = params.get('resource');

    try {
        decoded_link = JSON.parse(atob(decoded_link));
    } catch (e) {
        window.alert(`Corrupted Link! 
            
            ${params.get('resource')}..
        
        please report this to us by going to Contact Us.
            
            Further error: ${e}`);
    }

    if (decoded_link.updated) {
        // means new updated account request is made...
        let raw = atob(decoded_link.link);
        let code_html = raw.includes('.jpg') ? `<img src='https://bca-image-proxy.jasonbourne181997.workers.dev${raw}'/>` :
            `<div style="
    display: flex;
    border: 1px solid white;
    max-width: 300px;
    height: auto;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #ffffbb;
    color: black;
    margin: 0 auto;
">
  <p>Transfer Code: <span style="
    font-weight: bold;
">${raw.split('-')[0]}</span></p>
  
<p>Confirmation Code: <span style="
    font-weight: bold;
">${raw.split('-')[1]}</span></p></div>`;

        console.log(`${raw} and result ${code_html}`);

        info.innerHTML = `<table style="height: 127px;" width="100%">
<tbody>
<tr style="height: 35px;">
<td style="width: 23.0673%; height: 35px; text-align: right;">&nbsp;<strong>Account</strong></td>
<td style="width: 64.9327%; height: 35px; text-align: center;">
<div>${decoded_link.name}</div>
</td>
</tr>
<tr style="height: 35px; text-align: center;">
<td style="width: 23.0673%; height: 35px; text-align: right;">&nbsp;<strong>Request Date</strong></td>
<td style="width: 64.9327%; height: 35px;">&nbsp;
<div>${new Date(decoded_link.date)}</div>
</td>
</tr>
<tr style="height: 35px; text-align: center;">
<td style="width: 23.0673%; height: 35px; text-align: right;">&nbsp;<strong>Number of Ads Bypassed</strong></td>
<td style="width: 64.9327%; height: 35px;">&nbsp;
<div>${decoded_link.progress}</div>
</td>
</tr>
<tr style="height: 35px; text-align: center;">
<td style="width: 23.0673%; height: 35px; text-align: right;"><strong>Code</strong></td>
<td style="width: 64.9327%; height: 35px;">&nbsp;
    ${code_html}
  </td>
</tr>
</tbody>
</table>
    `;
        return;
    }

    info.innerHTML = `<table style="height: 127px;" width="100%">
<tbody>
<tr style="height: 35px;">
<td style="width: 23.0673%; height: 35px; text-align: right;">&nbsp;<strong>Account</strong></td>
<td style="width: 64.9327%; height: 35px; text-align: center;">
<div>${decoded_link.name}</div>
</td>
</tr>
<tr style="height: 35px; text-align: center;">
<td style="width: 23.0673%; height: 35px; text-align: right;">&nbsp;<strong>Request Date</strong></td>
<td style="width: 64.9327%; height: 35px;">&nbsp;
<div>${new Date(decoded_link.date)}</div>
</td>
</tr>
<tr style="height: 35px; text-align: center;">
<td style="width: 23.0673%; height: 35px; text-align: right;">&nbsp;<strong>Number of Ads Bypassed</strong></td>
<td style="width: 64.9327%; height: 35px;">&nbsp;
<div>${decoded_link.progress}</div>
</td>
</tr>
<tr style="height: 35px; text-align: center;">
<td style="width: 23.0673%; height: 35px; text-align: right;"><strong>Code</strong></td>
<td style="width: 64.9327%; height: 35px;">&nbsp;
    <img src='${decoded_link.link}'/>
  <br/>
  <a href='${decoded_link.link}' target='_blank'>View the code here</a>
  </td>
</tr>
</tbody>
</table>
    `;
})();
