struct Data {
    values: array<f32, 4>
};
            
@binding(0) @group(0) var<storage, read> src1: Data;
@binding(1) @group(0) var<storage, read> src2: Data;
@binding(2) @group(0) var<storage, read> dst: Data;

@compute @workgroup_size(1) 
fn main(@builtin(global_invocation_id) GlobalId: vec3<u32>) {
    let index: u32 = GlobalId.x;
    dst.values[index] = src1.values[index] + src2.values[index];
}
