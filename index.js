let width = window.innerWidth;
let height = window.innerHeight;

let node_size = 5;

//const colors = d3.scaleOrdinal(d3.schemeCategory10).domain([0, 9]);
const colors = {
  p1: "cyan",
  p2: "pink",
  road: "#FFE87C",
  text: "red"
};
const playerColors = [colors.p1, colors.p2];

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
    .classed("line", true)
    .attr("stroke-width", 20)
    .attr("stroke", colors.road);

  const circle = d3.select(".layout")
    .selectAll(".circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", 15)
    .classed("circle", true)
    .style("fill", colors.road);

  const node = d3.select(".layout")
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("text")
    .text(function(d) { return d.type === "Base" ? "\uf286" : "\uf447"; })
    .attr("font-size", "5em")
    //.attr("dominant-baseline", "middle")
    .attr("text-anchor", "middle")
    //.attr("font-family", "Font Awesome 5 Free")
    .classed("node", true)
    .attr("id", function(d) { return "node-" + d.name; })
    .style("fill", function(d, i) { return playerColors[d.owner]; })
    .on("click", onclick)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))
    .each(function(d) {
      d3.select(this).classed(d.type === "Base" ? "fab" : "fas", true);
    });

  d3.selectAll(".layout .fab").each(function(d, i) {
    if (i === 0) {
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
    .attr("font-size", "2em")
    //.attr("dominant-baseline", "top")
    .attr("text-anchor", "middle")
    .style("fill", function(d, i) { return playerColors[d.owner]; })
    .text(function(d) {
      if (d.power) return Math.max(...d.power).toFixed(2);
      return 0;
    });

  const simulation = d3.forceSimulation(nodes)
    .velocityDecay(0.2)
    .force("x", d3.forceX(width / 2).strength(0.1))
    .force("y", d3.forceY(height / 2).strength(0.1))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("link", d3.forceLink().distance(width / 5).links(data.links))
    .force("collide", d3.forceCollide())
    .force("charge", d3.forceManyBody().strength(-200))
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
    .style("fill", function(d, i) { return playerColors[data.owner[i + 1]]; });

  d3.select(".layout")
    .selectAll(".text")
    .style("fill", function(d, i) { return playerColors[data.owner[i + 1]]; })
    .text(function(d, i) {
      if (data.power[i + 1]) return Math.max(...data.power[i + 1]).toFixed(2);
      return 0;
    });
}

function updateFrame() {
  document.querySelector(".frame").innerText = frame + 1 + "/" + database.length;
}

function loadData(db) {
  database = JSON.parse(db);
  frame = 0;
  updateFrame();
  const data = database[0];
  document.getElementById("help").style.display = "none";
  const nodes = Object.keys(data.casualty_rate).map(node => {
    return {
      name: node,
      type: "Fort",
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

document.body.addEventListener("dragover", event => event.preventDefault(), false);
document.body.addEventListener("drop", dropHandler, false);

document.querySelector(".fa-step-forward").addEventListener("click", () => {
  if (!database.length) return;
  if (frame === database.length - 1) {
    alert("已经是最后一帧了！");
    return;
  }
  frame++;
  updateFrame();
  updateMap(database[frame]);
});

document.querySelector(".fa-step-backward").addEventListener("click", () => {
  if (!database.length) return;
  if (frame === 0) {
    alert("已经是第一帧了！");
    return;
  }
  frame--;
  updateFrame();
  updateMap(database[frame]);
});

document.querySelector(".fa-question-circle").addEventListener("click", () => {
  alert("可以拖动节点到固定位置。单击节点将其复位。颜色代表节点的所有者。数字代表兵力。点击对应的按钮来显示下一帧/上一帧。");
});
