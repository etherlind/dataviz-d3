const dims = {
    height: 300,
    width: 300,
    radius: 150
};

const cent = { x: (dims.width / 2) + 5, y: (dims.height / 2) + 5 };

const svg = d3.select('.canvas')
    .append('svg')
    .attr('width', dims.width + 150)
    .attr('height', dims.height + 150);

const graph = svg.append('g')
    .attr('transform', `translate(${cent.x}, ${cent.y})`);

const pie = d3.pie()
    .sort(null)
    .value(d => d.cost);

const arcPath = d3.arc()
    .outerRadius(dims.radius)
    .innerRadius(dims.radius / 2);

// update function
const update = data => {

    // join enhanced (pie) data to path element
    const paths = graph.selectAll('path')
        .data(pie(data));

    console.log(paths);

    paths.enter()
        .append('path')
        .append('class', 'arc')
        .append('d', arcPath)
        .attr('stroke', '#fff')
        .attr('stroke-width', 3);
}

// data array and firestore
let data = [];

db.collection('expenses').onSnapshot(res => {

    res.docChanges().forEach(change => {

        const doc = { ...change.doc.data(), id: change.doc.id };

        switch (change.type) {
            case 'added':
                data.push(doc);
                break;
            case 'modified':
                const index = data.findIndex(item => item.id === doc.id);
                data[index] = doc;
                break;
            case 'removed':
                data = data.filter(item => item.id !== doc.id);
                break;
            default:
                break;
        }
    });

    console.log(data);
    update(data);

});
