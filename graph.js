const margin = { top: 40, right: 20, bottom: 50, left: 100 };
const graphWidth = 560 - margin.left - margin.right;
const graphHeight = 400 - margin.top - margin.bottom;

const svg = d3.select('.canvas')
    .append('svg')
    .attr('width', graphWidth + margin.left + margin.right)
    .attr('height', graphHeight + margin.top + margin.bottom);

const graph = svg.append('g')
    .attr('width', graphWidth)
    .attr('height', graphHeight)
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

// scales
const x = d3.scaleTime().range([0, graphWidth]);
const y = d3.scaleLinear().range([graphHeight, 0]);

// axes groups
const xAxisGroup = graph
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${graphHeight})`);

const yAxisGroup = graph.append('g')
    .attr('class', 'y-axis');

// d3 line path generator
const line = d3.line()
    .x(d => x(new Date(d.date)))
    .y(d => y(d.distance));

// line path element
const path = graph.append('path');

let dottedLine = graph.append('path')
    .attr('fill', 'none')
    .attr('stroke', '#aaa')
    .style('stroke-dasharray', 4)
    .style('opacity', '0')
    .attr('stroke-width', 1);

const update = data => {

    data = data.filter(d => d.activity === activity);

    // sort data based on date object
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    // set scale domains
    x.domain(d3.extent(data, d => new Date(d.date)));
    y.domain([0, d3.max(data, d => d.distance)]);

    // update path data
    path.data([data])
        .attr('fill', 'none')
        .attr('stroke', '#00bfa5')
        .attr('stroke-width', 2)
        .attr('d', line);

    // create circles for objects
    const circles = graph.selectAll('circle').data(data);

    // remove unwanter points
    circles.exit().remove();

    // update current points
    circles
        .attr('cx', d => x(new Date(d.date)))
        .attr('cy', d => y(d.distance));

    // add new points
    circles.enter()
        .append('circle')
        .attr('r', 4)
        .attr('cx', d => x(new Date(d.date)))
        .attr('cy', d => y(d.distance))
        .attr('fill', '#ccc');

    graph.selectAll('circle')
        .on('mouseover', (d, i, n) => {
            d3.select(n[i])
                .transition().duration(100)
                .attr('r', 8)
                .attr('fill', 'white');

            const dY0 = { ...d };
            const dX0 = { ...d };

            dY0.distance = 0;
            dX0.date = d3.min(data).date;

            console.log(dX0);
            dottedLine.data([
                    [dX0, d, dY0]
                ])
                .style('opacity', 1)
                .attr('d', line);

        })
        .on('mouseout', (d, i, n) => {
            d3.select(n[i])
                .transition().duration(100)
                .attr('r', 4)
                .attr('fill', '#ccc');

            dottedLine.style('opacity', 0)
        });


    // create axes
    const xAxis = d3.axisBottom(x)
        .ticks(4)
        .tickFormat(d3.timeFormat('%b %d'));

    const yAxis = d3.axisLeft(y)
        .ticks(4)
        .tickFormat(d => d + 'm')

    //xAxis are generated and placed inside xAxisGroup
    xAxisGroup.call(xAxis);
    yAxisGroup.call(yAxis);

    xAxisGroup.selectAll('text')
        .attr('transform', `rotate(-40)`)
        .attr('text-anchor', 'end');
}

// data and firestore
let data = [];

db.collection('activities').onSnapshot(res => {
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

    update(data);
});
