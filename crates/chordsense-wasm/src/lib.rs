use wasm_bindgen::prelude::*;
use std::f32::consts::PI;

const C1_HZ: f32 = 32.70319566257483;
const SR: f32 = 22050.0;
const BPO: f32 = 24.0;
const N_BINS: usize = 144;
const HOP: usize = 2048;
const FILTER_SCALE: f32 = 1.0;

#[rustfmt::skip]
const CALIBRATION: [f32; 144] = [
    9.98801, 9.96129, 9.91805, 9.86831, 9.85692, 9.84028, 9.83221, 9.80805,
    9.77152, 9.71643, 9.75345, 9.70960, 9.64230, 9.64205, 9.65014, 9.57744,
    9.53443, 9.54125, 9.49339, 9.44602, 9.46196, 9.42095, 9.39794, 9.38968,
    9.32393, 9.22955, 9.23597, 9.19273, 9.15337, 9.12633, 9.06907, 9.03587,
    8.99384, 8.93530, 9.00962, 9.01056, 8.96673, 8.92669, 8.90692, 8.85368,
    8.82946, 8.86617, 8.83226, 8.77879, 8.73335, 8.69673, 8.66760, 8.65028,
    8.57230, 8.54989, 8.56090, 8.53347, 8.47222, 8.41659, 8.41922, 8.41105,
    8.36861, 8.32275, 8.33872, 8.33557, 8.30542, 8.24004, 8.22718, 8.17635,
    8.16866, 8.12596, 8.12997, 8.10315, 8.07446, 8.05802, 8.02623, 7.99026,
    7.96434, 7.90382, 7.88386, 7.85911, 7.83311, 7.82314, 7.77322, 7.73490,
    7.70859, 7.66624, 7.66447, 7.64596, 7.61555, 7.57423, 7.53529, 7.48558,
    7.47037, 7.43768, 7.41051, 7.40266, 7.40227, 7.35395, 7.31274, 7.28414,
    7.25489, 7.22601, 7.17719, 7.17500, 7.15727, 7.12413, 7.08794, 7.05115,
    7.00978, 6.99138, 6.94978, 6.95133, 6.92710, 6.88998, 6.85039, 6.80068,
    6.76866, 6.73980, 6.71789, 6.71928, 6.69790, 6.65790, 6.62284, 6.57016,
    6.55857, 6.52835, 6.50654, 6.48987, 6.45461, 6.41401, 6.39982, 6.38461,
    6.33609, 6.32616, 6.29917, 6.26961, 6.22144, 6.19964, 6.15574, 6.12891,
    6.10371, 6.07206, 6.04799, 6.04096, 6.01731, 5.98946, 5.97810, 5.90805,
];

#[wasm_bindgen]
pub struct CqtEngine {
    k_re: Vec<Vec<f32>>,
    k_im: Vec<Vec<f32>>,
    k_start: Vec<i32>,
    bin_scale: Vec<f32>,
    max_half: usize,
}

#[wasm_bindgen]
impl CqtEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let alpha = (2.0f32.powf(2.0 / BPO) - 1.0) / (2.0f32.powf(2.0 / BPO) + 1.0);
        let q = FILTER_SCALE / alpha;

        let mut k_re = Vec::with_capacity(N_BINS);
        let mut k_im = Vec::with_capacity(N_BINS);
        let mut k_start = Vec::with_capacity(N_BINS);
        let mut bin_scale = Vec::with_capacity(N_BINS);
        let mut max_half = 0usize;

        for k in 0..N_BINS {
            let freq = C1_HZ * 2.0f32.powf(k as f32 / BPO);
            let ilen = (q * SR) / freq;
            let n_start = (-ilen / 2.0).floor() as i32;
            let n_end = (ilen / 2.0).floor() as i32;
            let n_len = (n_end - n_start) as usize;

            let mut re = vec![0.0f32; n_len];
            let mut im = vec![0.0f32; n_len];
            let mut l1 = 0.0f32;

            for j in 0..n_len {
                let n = n_start + j as i32;
                let w = 0.5 - 0.5 * ((2.0 * PI * j as f32) / n_len as f32).cos();
                let theta = (n as f32 * 2.0 * PI * freq) / SR;
                re[j] = w * theta.cos();
                im[j] = w * theta.sin();
                l1 += w;
            }

            if l1 > 0.0 {
                let inv_l1 = 1.0 / l1;
                for j in 0..n_len {
                    re[j] *= inv_l1;
                    im[j] *= inv_l1;
                }
            }

            max_half = max_half.max((-n_start) as usize).max(n_end as usize);
            k_re.push(re);
            k_im.push(im);
            k_start.push(n_start);
            bin_scale.push(1.0 / ilen.sqrt());
        }

        Self {
            k_re,
            k_im,
            k_start,
            bin_scale,
            max_half,
        }
    }

    /// Computes calibrated log-CQT for an audio signal buffer.
    /// Returns a flat Float32Array of shape [frames * 144].
    pub fn compute_cqt(&self, signal: &[f32]) -> Vec<f32> {
        let pad = self.max_half;
        let mut padded = vec![0.0f32; signal.len() + 2 * pad];
        padded[pad..pad + signal.len()].copy_from_slice(signal);

        let frames = 1 + signal.len() / HOP;
        let mut output = vec![0.0f32; frames * N_BINS];

        for f in 0..frames {
            let center = (f * HOP + pad) as i32;
            let row_offset = f * N_BINS;

            for k in 0..N_BINS {
                let re = &self.k_re[k];
                let im = &self.k_im[k];
                let base = (center + self.k_start[k]) as usize;
                let len = re.len();

                let mut sre = 0.0f32;
                let mut sim = 0.0f32;

                let slice = &padded[base..base + len];
                for j in 0..len {
                    let s = slice[j];
                    sre += s * re[j];
                    sim += s * im[j];
                }

                let mag = (sre * sre + sim * sim).sqrt() * self.bin_scale[k];
                output[row_offset + k] = (mag + 1e-6).ln() + CALIBRATION[k];
            }
        }

        output
    }
}
