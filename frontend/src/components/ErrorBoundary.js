import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
export class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error('Uncaught error:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs("div", { style: { padding: '2rem', textAlign: 'center' }, children: [_jsx("h2", { children: "Something went wrong." }), _jsx("p", { children: this.state.error?.message }), _jsx("button", { onClick: () => this.setState({ hasError: false }), children: "Try again" })] }));
        }
        return this.props.children;
    }
}
