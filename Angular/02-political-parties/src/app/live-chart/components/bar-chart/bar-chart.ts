import { Component, effect, ElementRef, input, OnDestroy, OnInit, viewChild } from '@angular/core';
import { Chart, ChartData } from 'chart.js';

@Component({
  selector: 'bar-chart',
  imports: [],
  templateUrl: './bar-chart.html',
})
export class BarChart implements OnInit, OnDestroy {
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('chart');
  private _chartInstance: Chart | null = null;

  public chartData = input.required<ChartData<'bar'>>();

  private readonly updateChartData = effect(() => {
    if (this._chartInstance) {
      // this._chartInstance.data = this.chartData();

      this._chartInstance.data.labels = this.chartData().labels;
      this._chartInstance.data.datasets[0].data = this.chartData().datasets[0].data;
      this._chartInstance.data.datasets[0].backgroundColor =
        this.chartData().datasets[0].backgroundColor;
      this._chartInstance.data.datasets[0].borderColor = this.chartData().datasets[0].borderColor;

      this._chartInstance.update();
    }
  });

  ngOnInit() {
    const canvas = this.canvasRef()?.nativeElement;

    if (!canvas) throw new Error('Canvas element not found');

    this._chartInstance = new Chart(canvas, {
      type: 'bar',
      data: this.chartData(),
      options: {
        // animation: {
        //   duration: 0
        // },
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  ngOnDestroy() {
    this._chartInstance?.destroy();
    this._chartInstance = null;
  }
}
