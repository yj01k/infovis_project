class LineChart {
  margin = {
    top: 40, right: 200, bottom: 60, left: 60
  }

  constructor(svg, width = 500, height = 350) {
    this.svg = svg;
    this.width = width;
    this.height = height;
    this.handlers = {};
  }

  initialize(categories, years) {
    this.svg = d3.select(this.svg);
    this.container = this.svg.append("g");

    this.xScale = d3.scalePoint();
    this.yScale = d3.scaleLinear();
    this.colorScale = d3.scaleOrdinal();

    this.xAxis = this.container.append("g");
    this.yAxis = this.container.append("g");
    this.line = this.container.append("g");
    this.legend = this.svg.append("g");

    
    this.svg
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    this.container
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    if (d3.select(".line-tooltip").empty()) {
      d3.select("body")
        .append("div")
        .attr("class", "tooltip line-tooltip")
        .style("opacity", 0);
    }

    this.xScale.domain(years).range([0, this.width]);
    this.yScale.domain([0, 1]).range([this.height, 0]);

    this.colorScale.domain(categories).range(d3.schemeTableau10);

    this.xAxis
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${this.height})`);

    this.yAxis
      .attr("class", "y-axis");

    this.line.attr("class", "lines");

    this.legend
      .attr("class", "line-legend")
      .attr("transform", `translate(${this.width + this.margin.left + 20}, ${this.margin.top})`);
  }

  update(data) {
    const categories = Array.from(new Set(data.map(d => d.category)));
    const years = Array.from(new Set(data.map(d => d.year))).sort((a, b) => a - b);

    const pointsData = [];
    let maxCount = 1;
    categories.forEach(c => {
      years.forEach(y => {
        const cnt = data.filter(d => d.category === c && d.year === y).length;
        if (cnt > maxCount)
          maxCount = cnt;
        pointsData.push({ year: y, category: c, count: cnt });
      });
    });

    this.yScale.domain([0, maxCount]);
    this.xAxis.call(d3.axisBottom(this.xScale))
      .selectAll("text").style("font-size", "14");
    this.yAxis.call(d3.axisLeft(this.yScale))
      .selectAll("text").style("font-size", "14");
    this.lineGenerator = d3.line()
      .x(d => this.xScale(d.year))
      .y(d => this.yScale(d.count));

    this.line.selectAll(".line-path")
      .data(categories, d => d)
      .join(
        enter => enter.append("path")
          .attr("class", "line-path")
          .attr("fill", "none")
          .attr("stroke-width", 2)
          .attr("stroke", d => this.colorScale(d))
          .attr("d", d => this.lineGenerator(pointsData.filter(pt => pt.category === d))),
        update => update.transition().duration(300)
          .attr("d", d => this.lineGenerator(pointsData.filter(pt => pt.category === d))),
        exit => exit.remove()
      );

    this.container.selectAll(".line-point")
      .data(pointsData, d => `${d.category}-${d.year}`)
      .join(
        enter => enter.append("circle")
          .attr("class", "line-point")
          .attr("r", 4)
          .attr("fill", d => this.colorScale(d.category))
          .attr("cx", d => this.xScale(d.year))
          .attr("cy", d => this.yScale(d.count))
          .on("mouseover", (event, d) => {
            d3.select(".line-tooltip")
              .style("opacity", 1)
              .html(`Type: ${d.category}<br>Year: ${d.year}<br>Count: ${d.count}`)
              .style("left", (event.pageX + 8) + "px")
              .style("top", (event.pageY + 8) + "px");
          })
          .on("mousemove", event => {
            d3.select(".line-tooltip")
              .style("left", (event.pageX + 8) + "px")
              .style("top", (event.pageY + 8) + "px");
          })
          .on("mouseout", () => {
            d3.select(".line-tooltip").style("opacity", 0);
          })
          .on("click", (event, d) => {
            if (this.handlers.click)
              this.handlers.click(d.category, d.year);
          }),
        update => update.transition()
          .duration(300)
          .attr("cx", d => this.xScale(d.year))
          .attr("cy", d => this.yScale(d.count)),
        exit => exit.remove()
      );

    this.legend.selectAll(".legend-item")
      .data(categories, d => d)
      .join(
        enter => 
          enter.append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`)
            .style("cursor", "pointer")
            .on("click", (event, type) => {
              const legend = d3.select(event.currentTarget);
              const isDisabled = legend.classed("disabled");
              legend.classed("disabled", !isDisabled);

              this.container.selectAll(".line-path")
                .filter(d => d === type)
                .transition().duration(200)
                .style("opacity", isDisabled ? 1 : 0);
              this.container.selectAll(".line-point")
                .filter(d => d.category === type)
                .transition().duration(200)
                .style("opacity", isDisabled ? 1 : 0);

              legend.select("rect")
                .transition().duration(200)
                .attr("fill", !isDisabled ? "#ccc" : this.colorScale(type));
              legend.select("text")
                .transition().duration(200)
                .attr("fill", !isDisabled ? "#999" : "#000");
            })
            .append("rect")
              .attr("x", 0).attr("y", -8)
              .attr("width", 12).attr("height", 12)
              .attr("fill", d => this.colorScale(d))
            .select(function() { return this.parentNode; })
            .append("text")
              .attr("x", 18).attr("y", 0)
              .attr("dy", "0.35em")
              .text(d => d)
              .attr("fill", "#000"),
        update => update,
        exit => exit.remove()
      );
  }

  onLinePoint(eventType, handler) {
    this.handlers[eventType] = handler;
  }
}
