class HeatMap {
  margin = {
    top: 40, right: 20, bottom: 60, left: 150
  }

  constructor(svg, width = 500, height = 350) {
    this.svg = svg;
    this.width = width;
    this.height = height;
    this.categories = [];
    this.years = [];
    this.handlers = {};
  }

  initialize(categories, years) {
    this.svg = d3.select(this.svg);
    this.container = this.svg.append("g");
    this.years = years.slice().sort((a, b) => a - b);
    this.categories = categories.slice();

    this.xScale = d3.scaleBand();
    this.yScale = d3.scaleBand();
    this.colorScale = d3.scaleSequential(d3.interpolateReds);

    this.xAxis = this.container.append("g");
    this.yAxis = this.container.append("g");

    this.svg
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);
    
    this.container.attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    if (d3.select(".heatmap-tooltip").empty()) {
      d3.select("body")
        .append("div")
        .attr("class", "tooltip heatmap-tooltip")
        .style("opacity", 0);
    }

    this.xScale.domain(this.years).range([0, this.width]).padding(0.05);
    this.yScale.domain(this.categories).range([0, this.height]).padding(0.05);

    this.colorScale.domain([1, 1]);

    this.xAxis
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${this.height})`)
      .call(d3.axisBottom(this.xScale).tickFormat(d3.format("d")))
      .selectAll("text")
      .style("font-size", "14");

    this.yAxis
      .attr("class", "y-axis")
      .call(d3.axisLeft(this.yScale))
      .selectAll("text")
      .style("font-size", "14");
  }

  update(data, yearRange) {
    let filtered = data;
    if (Array.isArray(yearRange) && yearRange.length === 2) {
      const [minY, maxY] = yearRange;
      filtered = data.filter(d => d.year >= minY && d.year <= maxY);
    }

    let years = this.years;
    if (Array.isArray(yearRange) && yearRange.length === 2) {
      const [minY, maxY] = yearRange;
      years = this.years.filter(y => y >= minY && y <= maxY);
    }

    const countArray = [];
    let maxCount = 1;
    years.forEach(y => {
      this.categories.forEach(c => {
        const cnt = filtered.filter(d => d.year === y && d.category === c).length;
        if (cnt > maxCount)
          maxCount = cnt;
        countArray.push({ year: y, category: c, count: cnt });
      });
    });

    this.xScale.domain(years);
    this.yScale.domain(this.categories);
    this.colorScale.domain([1, maxCount]);

    this.xAxis.call(d3.axisBottom(this.xScale));
    this.yAxis.call(d3.axisLeft(this.yScale));

    this.container.selectAll(".heatmap-cell")
      .data(countArray, d => `${d.year}-${d.category}`)
      .join(
        enter => 
          enter.append("rect")
            .attr("class", "heatmap-cell")
            .attr("x", d => this.xScale(d.year))
            .attr("y", d => this.yScale(d.category))
            .attr("width", this.xScale.bandwidth())
            .attr("height", this.yScale.bandwidth())
            .style("stroke", "#ccc")
            .style("stroke-width", 1)
            .style("fill", d => d.count === 0 ? "#fff" : this.colorScale(d.count))
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
              d3.select(".heatmap-tooltip")
                .style("opacity", 1)
                .html(
                  `Year: ${d.year}<br>` +
                  `Type: ${d.category}<br>` +
                  `Count: ${d.count}`
                )
                .style("left", (event.pageX + 8) + "px")
                .style("top", (event.pageY + 8) + "px");
            })
            .on("mousemove", event => {
              d3.select(".heatmap-tooltip")
                .style("left", (event.pageX + 8) + "px")
                .style("top", (event.pageY + 8) + "px");
            })
            .on("mouseout", () => {
              d3.select(".heatmap-tooltip").style("opacity", 0);
            })
            .on("click", (event, d) => {
              if (this.handlers.click)
                this.handlers.click(d.category, d.year);
            }),
        update => update.transition().duration(300)
          .attr("x", d => this.xScale(d.year))
          .attr("y", d => this.yScale(d.category))
          .attr("width", this.xScale.bandwidth())
          .attr("height", this.yScale.bandwidth())
          .style("fill", d => d.count === 0 ? "#fff" : this.colorScale(d.count)),
        exit => exit.remove()
      );
  }

  onCell(eventType, handler) {
    this.handlers[eventType] = handler;
  }
}
