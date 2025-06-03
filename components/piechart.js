class PieChart {
  margin = {
    top: 40, right: 40, bottom: 40, left: 50
  }

  constructor(svg, width = 350, height = 350) {
    this.svg = svg;
    this.width = width;
    this.height = height;
    this.radius = Math.min(this.width, this.height) / 2 - 10;
    this.handlers = {};
  }

  initialize(categories) {
    this.svg = d3.select(this.svg);
    this.container = this.svg.append("g");
    
    this.colorScale = d3.scaleOrdinal();

    this.pie = d3.pie();
    this.arc = d3.arc();

    this.svg
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    this.container
      .attr("transform", `translate(${this.margin.left + this.width / 2}, ${this.margin.top + this.height / 2})`);

    if (d3.select(".pie-tooltip").empty()) {
      d3.select("body")
        .append("div")
        .attr("class", "tooltip pie-tooltip")
        .style("opacity", 0);
    }

    this.colorScale.domain(categories).range(d3.schemeTableau10);
    this.pie.value(d => d.count).sort(null);
    this.arc.innerRadius(0).outerRadius(this.radius);
  }

  update(data) {
    const categories = Array.from(new Set(data.map(d => d.category)));
    const countArray = categories.map(type => ({
      category: type,
      count: data.filter(d => d.category === type).length
    }));

    const pieData = this.pie(countArray);

    this.container.selectAll(".slice")
      .data(pieData, d => d.data.category)
      .join(
        enter => {
          enter.append("path")
            .attr("class", "slice")
            .attr("d", this.arc)
            .attr("fill", d => this.colorScale(d.data.category))
            .style("stroke", "#fff")
            .style("stroke-width", 1)
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
              d3.select(".pie-tooltip")
                .style("opacity", 1)
                .html(`Type: ${d.data.category}<br>Count: ${d.data.count}`)
                .style("left", (event.pageX + 8) + "px")
                .style("top", (event.pageY + 8) + "px");
            })
            .on("mousemove", event => {
              d3.select(".pie-tooltip")
                .style("left", (event.pageX + 8) + "px")
                .style("top", (event.pageY + 8) + "px");
            })
            .on("mouseout", () => {
              d3.select(".pie-tooltip")
                .style("opacity", 0);
            })
            .on("click", (event, d) => {
              if (this.handlers.click)
                this.handlers.click(d.data.category);
            })
            .transition()
            .duration(300)
            .attr("d", this.arc);
        },
        update => update,
        exit => exit.remove()
      );
  }

  onSlice(eventType, handler) {
    this.handlers[eventType] = handler;
  }
}
