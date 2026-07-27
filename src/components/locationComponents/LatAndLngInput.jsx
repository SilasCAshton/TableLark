function LatAndLngInput({
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  processLatitudeAndLongitude,
  clamp,
}) {
  return (
    <div>
      <h2>Enter latitude and longitude</h2>

      <label>
        Latitude
        <input
          type="number"
          placeholder="Latitude"
          value={latitude}
          onChange={(event) =>
            setLatitude(event.target.value)
          }
          onBlur={() => {
            if (latitude === "") {
              return;
            }

            setLatitude(
              String(clamp(Number(latitude), -90, 90)),
            );
          }}
          max="90"
          min="-90"
          step="any"
        />
      </label>

      <label>
        Longitude
        <input
          type="number"
          placeholder="Longitude"
          value={longitude}
          onChange={(event) =>
            setLongitude(event.target.value)
          }
          onBlur={() => {
            if (longitude === "") {
              return;
            }

            setLongitude(
              String(clamp(Number(longitude), -180, 180)),
            );
          }}
          max="180"
          min="-180"
          step="any"
        />
      </label>

      <button
        type="button"
        onClick={() =>
          processLatitudeAndLongitude(
            latitude,
            longitude,
          )
        }
      >
        Set Location
      </button>
    </div>
  );
}

export default LatAndLngInput;
