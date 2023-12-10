



function calculateSimilarity(list1, list2) {
    const set1 = new Set(list1);
    const set2 = new Set(list2);
    const commonElements = new Set([...set1].filter(x => set2.has(x)));
    const smallerListSize = Math.min(set1.size, set2.size);
    return (commonElements.size / smallerListSize) * 100;
}


function calculateAndDisplay() {
    const list1 = document.getElementById('list1').value.split('\n');
    const list2 = document.getElementById('list2').value.split('\n');
    const similarity = calculateSimilarity(list1, list2);

    document.getElementById('result').innerText = `Similarité de la SERP : ${similarity.toFixed(2)}%`;

    d3.select("#venn").html("");
    drawVennDiagram(similarity);
}



function drawVennDiagram(overlapPercentage) {
    const width = 400, height = 400;
    const svg = d3.select("#venn").append("svg")
        .attr("width", width)
        .attr("height", height);
    const radius = 100;
    const overlapDistance = overlapPercentage === 0 ? radius * 2 : (1 - (overlapPercentage / 100)) * radius;

    const circles = [
        { "x": width / 2 - overlapDistance, "y": height / 2, "radius": radius, "color": "blue", "opacity": 0.5 },
        { "x": width / 2 + overlapDistance, "y": height / 2, "radius": radius, "color": "red", "opacity": 0.5 }
    ];

    svg.selectAll("circle")
        .data(circles)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .attr("r", function(d) { return d.radius; })
        .style("fill", function(d) { return d.color; })
        .style("opacity", function(d) { return d.opacity; });

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .text(`${overlapPercentage.toFixed(2)}% Similarité`);
}

function fetchAndCompare() {
    try {
        if((document.querySelector('#input-area')?.checkValidity() ?? false) == false) {
            document.querySelector('#input-area')?.reportValidity();
            return false;
        }
        
        if(document.querySelector('#buttom-compare')?.classList.contains('loading')) {
            return false;
        }
        
        document.querySelector('#buttom-compare')?.classList.add('loading');
        
        const keyword1 = document.getElementById('keyword1').value;
        const keyword2 = document.getElementById('keyword2').value;
        
        Promise.all([fetchUrls(keyword1), fetchUrls(keyword2)]).then(results => {
            const [urls1, urls2] = results;
            const commonUrls = (urls1 ?? []).filter(url => urls2.includes(url));
            const similarity = calculateSimilarity(urls1, urls2);
            
            document.querySelector('#buttom-compare')?.classList.remove('loading');
            
            document.getElementById('result').innerText = `Similarité: ${similarity.toFixed(2)}%`;
            d3.select("#venn").html("");
            drawVennDiagram(similarity);
            displayUrls(urls1, urls2, commonUrls);
            
            scrollTo(0, document.getElementById('result')?.offsetTop ?? 0);
        });
        
        return true;
    }
    catch(error) {
        console.error(error);
        document.querySelector('#buttom-compare')?.classList.remove('loading');
        return false;
    }
}

function fetchUrls(keyword) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({ 
            "q": keyword,
            "gl": "fr", 
            "hl": "fr" 
 });

    const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

    return fetch("https://semrank.io/admin/api/get-serp", requestOptions)
        .then(response => response.json())
        .then(result => Object.values(result.message.organic).map(item => item.link))
        .catch(error => console.error('Error:', error));
}
function displayUrls(list1, list2, commonUrls) {
    const list1Container = document.getElementById('list1Urls');
    const list2Container = document.getElementById('list2Urls');
    list1Container.innerHTML = '';
    list2Container.innerHTML = '';
    function createUrlElement(url, isCommon) {
        const urlElement = document.createElement('div');
        urlElement.classList.add('url-item');
        urlElement.innerText = url;
        if (isCommon) {
            const color = getUniqueColor(commonUrls.indexOf(url));
            urlElement.style.backgroundColor = color;
        }
        return urlElement;
    }

    list1.forEach(url => {
        list1Container.appendChild(createUrlElement(url, commonUrls.includes(url)));
    });

    list2.forEach(url => {
        list2Container.appendChild(createUrlElement(url, commonUrls.includes(url)));
    });
}

const colors = ["#a2d5f2", "#f2a2d5", "#d5f2a2", "#a2f2d5", "#f2d5a2", "#d5a2f2"]; // Add more colors as needed

function getUniqueColor(index) {
    return colors[index % colors.length];
}

/**
 * 
 * @param {{id: string, style: string[], classes: string[]}} _params 
 * @param {boolean} _from_remote 
 * @returns 
 */
function loadingGIF(_params = {}, _from_remote = false) {
    if(_from_remote == false) {
        return `
            <div
                ${_params.id && `id="${_params.id}"` || ""}
                class="loading-gif ${_params.classes && _params.classes.join(' ') || ""}"
                ${_params.style ? `style="${_params.style.join('')}"` : ""}
            >
                <div class="loader-circle"></div>
                <div class="loader-bar"></div>
            </div>
        `
    };
}

document.addEventListener('DOMContentLoaded', (e) => {
    document.querySelector('#input-area')?.addEventListener('submit', (e) => {
        e.preventDefault();
        fetchAndCompare();
    });
    
    // Lancer le formulaire en appuyant sur Enter
    ["#keyword1", "#keyword2"]
    .map(selector => document.querySelector(selector))
    .forEach(elem => {
        if(!(elem instanceof HTMLElement)) {return false;}
        
        elem.addEventListener('keydown', function(e) {
            if(e.key == "Enter") {
                e.preventDefault();
                fetchAndCompare()
            }
        });
        elem.addEventListener('keyup', function(e) {
            if(e.key == "Enter") {
                fetchAndCompare()
            }
        });
    });
});