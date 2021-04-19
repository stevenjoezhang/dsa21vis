let width = window.innerWidth;
let height = window.innerHeight;

let node_size = 5;

const colors = [
  ['#a5d5d8', '#ffffe0', '#ffbcaf'], ['#00429d', '#4771b2', '#73a2c6'], ["#93003a", "#cf3759", "#f4777f"]
];

let frame = 0;
let database = [];

d3.select("#preview")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .classed("layout", true)
  .on("dblclick", () => {})
  .on("click", () => {});

function loadMap(data) {
  localStorage.setItem("select-data", data);
  d3.selectAll(".layout *").remove();
  const { nodes, links } = data;

  const link = d3.select(".layout")
    .selectAll(".link")
    .data(links)
    .enter()
    .append("line")
    .classed("link", true)
    .attr("stroke-width", 10)
    .attr("stroke", colors[0][1]);

  const circle = d3.select(".layout")
    .selectAll(".circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", 15)
    .classed("circle", true)
    .style("fill", function(d, i) { return colors[d.owner + 1][0]; })
    .on("click", onclick)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  const node = d3.select(".layout")
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("text")
    //.text(function(d) { return d.type === "Base" ? "\uf286" : "\uf447"; })
    .style("font-size", "5em")
    //.attr("dominant-baseline", "middle")
    .attr("text-anchor", "middle")
    //.attr("font-family", "Font Awesome 5 Free")
    .classed("node", true)
    .attr("id", function(d) { return "node-" + d.name; })
    .style("fill", function(d, i) { return colors[d.owner + 1][0]; })
    .each(function(d) {
      d3.select(this).classed(d.type === "Base" ? "fab" : "fas", true);
    });

  d3.selectAll(".layout .fab").each(function(d, i) {
    if (d.owner === 0) {
      d.fx = width * 0.15;
      d.fy = height * 0.15;
    } else {
      d.fx = width * 0.85;
      d.fy = height * 0.85;
    };
  });

  const text = d3.select(".layout")
    .selectAll(".text")
    .data(nodes)
    .enter()
    .append("text")
    .classed("text", true)
    .style("font-size", "2em")
    //.attr("dominant-baseline", "top")
    .attr("text-anchor", "middle")
    .style("fill", function(d, i) { return colors[d.owner + 1][0]; })
    .text(function(d) {
      if (d.power) return Math.max(...d.power).toFixed(2);
      return 0;
    });

  const simulation = d3.forceSimulation(nodes)
    .velocityDecay(0.2)
    .force("x", d3.forceX(width / 2).strength(0.1))
    .force("y", d3.forceY(height / 2).strength(0.1))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("link", d3.forceLink().distance(width / 8).links(data.links))
    .force("collide", d3.forceCollide())
    .force("charge", d3.forceManyBody().strength(-2000))
    .on("tick", ticked);

  function ticked() {
    link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    node.attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; });

    circle.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });

    text.attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y + 50; });
  }

  function onclick(event, d) {
    if (d.fx) d.fx = null;
    if (d.fy) d.fy = null;

    simulation.alpha(0.1).restart();
  }

  function dragstarted(event, d) {
    d3.select(this)
      .classed("active", true);
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended() {
    d3.select(this)
      .classed("active", false);

    simulation.alpha(0.1).restart();
  }
}

document.querySelector("#node-size-range").addEventListener("input", event => {
  const factor = event.target.value / 50;
  const node_size = 2.5 * Math.pow(2, factor);
  d3.selectAll(".layout .node")
    .attr("r", node_size);
  d3.selectAll(".layout .text")
    .attr("x", d => d.x + 1.2 * node_size)
    .attr("y", d => d.y - 1.2 * node_size);
  d3.selectAll(".layout .line")
    .attr("stroke-width", 0.5 * Math.pow(2, factor));
});

document.querySelector("#node-name-toggle").addEventListener("click", event => {
  const toggle = event.currentTarget.querySelector("i");
  if (toggle.classList.contains("fa-toggle-off")) {
    toggle.classList.replace("fa-toggle-off", "fa-toggle-on");
    document.querySelector(".layout").style.setProperty("--display", "block");
  } else {
    toggle.classList.replace("fa-toggle-on", "fa-toggle-off");
    document.querySelector(".layout").style.setProperty("--display", "none");
  }
});

function dropHandler(ev) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (ev.dataTransfer.files) {
    // Use DataTransferItemList interface to access the file(s)
    const file = ev.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
      loadData(event.target.result);
    };
    reader.readAsText(file);
  }
}

function updateMap(data) {

  d3.select(".layout")
    .selectAll(".node")
    .transition()
    .duration(1000)
    .style("fill", function(d, i) { return colors[data.owner[i + 1] + 1][0]; });

  d3.select(".layout")
    .selectAll(".circle")
    .transition()
    .duration(1000)
    .style("fill", function(d, i) { return colors[data.owner[i + 1] + 1][0]; });

  d3.select(".layout")
    .selectAll(".text")
    .transition()
    .duration(1000)
    .style("fill", function(d, i) { return colors[data.owner[i + 1] + 1][0]; })
    .textTween(function(d, i) {
      const f = data.power[i + 1] ? Math.max(...data.power[i + 1]) : 0;
      const interpolate = d3.interpolate(d3.select(this).text(), f);
      return function(t) { return interpolate(t).toFixed(2); };
    });

  d3.select(".layout")
    .selectAll(".link")
    .transition()
    .duration(1000)
    .attr("stroke", function(d, i) {
      if (data.owner[d.source.name] === 0 && data.owner[d.target.name] === 0) return colors[1][1];
      if (data.owner[d.source.name] === 1 && data.owner[d.target.name] === 1) return colors[2][1];
      return colors[0][1];
    });
}

function updateFrame() {
  document.querySelector(".frame").innerText = frame + 1 + "/" + database.length;
}

function loadData(db) {
  database = JSON.parse(db);
  console.log(database);
  frame = 0;
  updateFrame();
  const data = database[0];
  document.getElementById("help").style.display = "none";
  const nodes = Object.keys(data.casualty_rate).map(node => {
    return {
      name: node,
      type: data.owner[node] === -1 ? "Fort" : "Base",
      owner: data.owner[node],
      power: data.power[node]
    };
  });
  const links = [];
  Object.keys(data.edges).forEach(source => {
    data.edges[source].forEach(target => {
      if (target > source) links.push({
        source: source - 1,
        target: target - 1
      });
    });
  });
  console.log(data);
  loadMap({
    nodes,
    links
  });
}

function userAction(data, callback) {
  const { actions } = data;
  if (!actions) return callback();
  const army = [];
  Object.values(actions).forEach((action, owner) => {
    for (let [from, to, radius] of action) {

      console.log(from, to, radius);
      x1 = d3.select("#node-" + from).attr("x");
      x2 = d3.select("#node-" + to).attr("x");
      y1 = d3.select("#node-" + from).attr("y");
      y2 = d3.select("#node-" + to).attr("y");
      army.push({
        x1,
        x2,
        y1,
        y2,
        radius,
        owner
      });
    }
  });

  const node = d3.select(".layout")
    .selectAll(".army")
    .data(army)
    .enter()
    .append("text")
    .text("\uf135")
    .style("font-size", "0em")
    .classed("fas", true)
    .style("fill", function(d, i) { return colors[d.owner + 1][2]; })
    .style("fill-opacity", "0.7")
    .attr("x", function(d) { return d.x1; })
    .attr("y", function(d) { return d.y1; })
    .transition()
    .duration(500)
    .style("font-size", function(d) {
      if (d.radius < 5) d.radius = 5;
      if (d.radius > 100) d.radius = 100;
      return Math.log(d.radius) + "em";
    })
    .attr("text-anchor", "middle")
    .transition()
    .duration(4000)
    .attr("x", function(d) { return d.x2; })
    .attr("y", function(d) { return d.y2; })
    .transition()
    .duration(500)
    .style("font-size", "0em")
    .remove()
    .on("end", callback);
}

document.body.addEventListener("dragover", event => event.preventDefault(), false);
document.body.addEventListener("drop", dropHandler, false);

function forward() {
  if (!database.length) return;
  if (frame === database.length - 1) {
    alert("已经是最后一帧了！");
    return;
  }
  frame++;
  updateFrame();
  userAction(database[frame], () => {
    updateMap(database[frame]);
  });
}
document.querySelector(".fa-step-forward").addEventListener("click", forward);

function backward() {
  if (!database.length) return;
  if (frame === 0) {
    alert("已经是第一帧了！");
    return;
  }
  frame--;
  updateFrame();
  updateMap(database[frame]);
}
document.querySelector(".fa-step-backward").addEventListener("click", backward);

document.querySelector(".fa-question-circle").addEventListener("click", () => {
  alert("可以拖动节点到固定位置。单击节点将其复位。颜色代表节点的所有者。数字代表兵力。点击对应的按钮或键盘上的左、右箭头键来显示上一帧/下一帧。");
});

document.addEventListener("keydown", event => {
  switch (event.key) {
    case "ArrowRight":
      forward();
      break;
    case "ArrowLeft":
      backward();
      break;
  }
});
