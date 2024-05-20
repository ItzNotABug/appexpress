type SampleTypedReactComponentProps = { title: string; };

const SampleTypedReactComponent = ({ title }: SampleTypedReactComponentProps) => {
    return <h1>Welcome to {title}</h1>;
};

export default SampleTypedReactComponent;
