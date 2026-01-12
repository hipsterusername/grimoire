import { Layer, Image } from 'react-konva'
import useImage from 'use-image'
import type { MapData } from '../../../types'

interface MapLayerProps {
  map: MapData | null
}

export function MapLayer({ map }: MapLayerProps) {
  const [image] = useImage(map?.imageUrl ?? '', 'anonymous')

  if (!map || !image) {
    return <Layer listening={false} />
  }

  return (
    <Layer listening={false}>
      <Image
        image={image}
        x={0}
        y={0}
        width={map.imageWidth}
        height={map.imageHeight}
      />
    </Layer>
  )
}
