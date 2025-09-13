/* istanbul ignore file */
// Placeholder – integrera med Photoshop UXP (batchPlay) i nästa steg.
export interface Region { x:number; y:number; width:number; height:number }
export interface MaskOptions { feather:number; expand:number }

export async function applyMaskToNewLayer(image: ArrayBuffer, region: Region, opts: MaskOptions){
  // TODO: Read active selection, feather/expand, create new layer, paste image buffer.
  return true;
}