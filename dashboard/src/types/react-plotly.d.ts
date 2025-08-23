declare module 'react-plotly.js' {
  import { Component } from 'react';

  interface PlotData {
    x?: any[];
    y?: any[];
    z?: any[];
    type?: string;
    mode?: string;
    name?: string;
    marker?: any;
    line?: any;
    fill?: string;
    fillcolor?: string;
    text?: string | string[];
    textposition?: string;
    hovertemplate?: string;
    values?: number[];
    labels?: string[];
    hole?: number;
    showlegend?: boolean;
    [key: string]: any;
  }

  interface Layout {
    title?: string | { text: string; [key: string]: any };
    xaxis?: any;
    yaxis?: any;
    showlegend?: boolean;
    margin?: { l?: number; r?: number; t?: number; b?: number };
    paper_bgcolor?: string;
    plot_bgcolor?: string;
    font?: any;
    height?: number;
    width?: number;
    [key: string]: any;
  }

  interface Config {
    displayModeBar?: boolean;
    responsive?: boolean;
    [key: string]: any;
  }

  interface PlotProps {
    data: PlotData[];
    layout?: Layout;
    config?: Config;
    onInitialized?: (figure: any, graphDiv: HTMLElement) => void;
    onUpdate?: (figure: any, graphDiv: HTMLElement) => void;
    onPurge?: (figure: any, graphDiv: HTMLElement) => void;
    onError?: (err: any) => void;
    style?: React.CSSProperties;
    className?: string;
    useResizeHandler?: boolean;
    [key: string]: any;
  }

  export default class Plot extends Component<PlotProps> {}
}