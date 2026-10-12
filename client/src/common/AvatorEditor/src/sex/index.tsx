export default function Sex(props: any) {
  const { sex } = props;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        color: "white",
        userSelect: "none",
      }}
    >
      {sex[0].toUpperCase()}
    </div>
  );
}
