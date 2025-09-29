import plotly.graph_objects as go
import plotly.express as px
import json

# Data from the provided JSON
data = {
    "atividades": [
        {"nome": "Registrar Infração", "manual": 10, "digital": 0.5},
        {"nome": "Encontrar Histórico", "manual": 15, "digital": 0.1},
        {"nome": "Gerar Relatório", "manual": 300, "digital": 2}
    ]
}

# Extract data for plotting
activities = [item["nome"] for item in data["atividades"]]
manual_times = [item["manual"] for item in data["atividades"]]
digital_times = [item["digital"] for item in data["atividades"]]

# Abbreviate activity names to stay under 15 character limit
abbreviated_activities = [
    "Reg. Infração",
    "Enc. Histórico", 
    "Gerar Relatório"
]

# Create the bar chart
fig = go.Figure()

# Add manual bars (blue/cyan color)
fig.add_trace(go.Bar(
    name='Manual',
    x=abbreviated_activities,
    y=manual_times,
    marker_color='#5D878F',  # Cyan color for manual
    text=[f'{time} min' for time in manual_times],
    textposition='outside'
))

# Add digital bars (green color)
fig.add_trace(go.Bar(
    name='Digital',
    x=abbreviated_activities,
    y=digital_times,
    marker_color='#2E8B57',  # Sea green color for digital
    text=[f'{time} min' for time in digital_times],
    textposition='outside'
))

# Update layout
fig.update_layout(
    title='Comparativo de Tempo: Manual vs Digital',
    xaxis_title='Atividades',
    yaxis_title='Minutos',
    barmode='group',
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
)

# Update traces for better display
fig.update_traces(cliponaxis=False)

# Save as both PNG and SVG
fig.write_image("chart.png")
fig.write_image("chart.svg", format="svg")

print("Chart saved as chart.png and chart.svg")