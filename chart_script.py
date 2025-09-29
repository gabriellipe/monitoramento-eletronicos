import plotly.express as px
import plotly.graph_objects as go

# Data for the pie chart
categories = ["Leves", "Graves", "Muito Graves"]
values = [156, 67, 17]
percentages = [65, 28, 7]
colors = ["#10B981", "#F59E0B", "#EF4444"]

# Create labels with both absolute values and percentages
labels = [f"{cat}<br>{val} ({pct}%)" for cat, val, pct in zip(categories, values, percentages)]

# Create the pie chart
fig = go.Figure(data=[go.Pie(
    labels=categories,
    values=values,
    text=labels,
    textinfo='text',
    marker=dict(colors=colors),
    hovertemplate='<b>%{label}</b><br>Quantidade: %{value}<br>Percentual: %{percent}<extra></extra>'
)])

# Update layout
fig.update_layout(
    title="Distribuição de Infrações por Categoria",
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5),
    uniformtext_minsize=14, 
    uniformtext_mode='hide'
)

# Save as PNG and SVG
fig.write_image("chart.png")
fig.write_image("chart.svg", format="svg")

fig.show()