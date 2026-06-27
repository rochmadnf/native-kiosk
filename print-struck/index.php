<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require __DIR__ . '/vendor/autoload.php';

use Mike42\Escpos\Printer;
use Mike42\Escpos\EscposImage;
use Mike42\Escpos\PrintConnectors\CupsPrintConnector;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;

class StrukPrinter
{
    public function formatHari(string $date)
    {
        $parts = explode('-', $date);
        if (count($parts) === 3) {
            $convertedDate = $parts[2] . '-' . $parts[1] . '-' . $parts[0];
        } else {
            return "Format tanggal tidak dikenali.";
        }

        if (strtotime($convertedDate) === false) {
            return "Tanggal tidak valid.";
        }

        $Hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        $Bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

        $timestamp = strtotime($convertedDate);
        $hari = $Hari[date("w", $timestamp)];
        $tgl = date("d", $timestamp);
        $bulan = $Bulan[(int)date("m", $timestamp) - 1];
        $tahun = date("Y", $timestamp);

        return "$hari, $tgl $bulan $tahun";
    }

    public function printStruk()
    {


        $from = ['from' => null, 'patient' => null, 'no_urut' => null];

        $formatData = json_decode(file_get_contents('php://input'), true);

        if (!isset($formatData['from'])) {
            $formatData = [...$formatData, ...$from];
        } else {
            $formatData = array_merge($formatData, ['from' => $formatData['from'], 'no_urut' => $formatData['no_urut'], 'patient' =>  $formatData['patient']]);
        }

        $nomor = $formatData['nomor_antrian'];
        $dilayani = $formatData['perkiraan_dilayani'];
        $tanggal = $formatData['tanggal'];
        $jam = $formatData['jam'];
        $pin = $formatData['pin'];

        $fromWs = $formatData['from'];
        $patient = $formatData['patient'];
        $noUrut = $formatData['no_urut'];

        $nama_printer = 'smb://localhost/POS-80C';

        try {

            if (PHP_OS_FAMILY === 'Linux') {
                $connector = new CupsPrintConnector($nama_printer);
            } else {
                $connector = new WindowsPrintConnector($nama_printer);
            }
            if (!$connector) {
                throw new Exception("Jenis koneksi tidak valid atau parameter kurang.");
            }


            $printer = new Printer($connector);

            /* Start the printer */
            $printer = new Printer($connector);
            $logo = EscposImage::load("resources/1070365.png", false);
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->bitImage($logo);

            $printer->feed();
            $printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH);
            $printer->text("NABELO\n");
            $printer->selectPrintMode();
            $printer->setEmphasis(true);
            $printer->text("Layanan Digital Puskesmas Kota Palu\n");
            $printer->setEmphasis(false);
            $printer->feed();

            $printer->selectPrintMode();
            $printer->text("Terima Kasih, Nomor Antrian Anda\n");
            $printer->feed();
            $printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH);
            $printer->setTextSize(6, 6);
            $printer->text($nomor . "\n");
            $printer->selectPrintMode();
            $printer->feed();


            if (!is_null($fromWs)) {
                $printer->text("Daftar Melalui: Mobile JKN. \n");
                $printer->feed();
                $printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH);
                $printer->setTextSize(4, 4);
                $printer->text($noUrut . "\n");
                $printer->setEmphasis(true);
                $printer->selectPrintMode();
                $printer->text("Nama: " . $patient['name'] . ".\n");
                $printer->text("NIK: " . substr($patient['nik'], 0, -4) . 'xxxx' . ".\n");
                $printer->setEmphasis(false);
                $printer->text("Alamat: " . $patient['address']);
                $printer->feed(3);
            }

            $printer->setEmphasis(true);
            $printer->text("Perkiraan Dilayani : " . $dilayani . ".\n");
            $printer->setEmphasis(false);
            $printer->feed(2);


            if (isset($formatData['self_service'])) {
                if (!$formatData['self_service']['status_bpjs'] || !$formatData['self_service']['faskes_match']) {
                    $printer->selectPrintMode(Printer::MODE_DOUBLE_WIDTH);
                    $printer->setTextSize(2, 2);
                    $printer->setEmphasis(true);
                    $printer->text("UMUM\n");
                    $printer->setEmphasis(false);
                    $printer->selectPrintMode();
                    $printer->text("Faskes " . $formatData['self_service']['faskes_name'] . ($formatData['self_service']['status_bpjs'] ? "" : "(Tidak Aktif)") . "\n");
                    $printer->feed(2);
                }
            }


            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->text("Sistem Antrian Online\n");
            $printer->text("Bergerak Semakin Cepat\n");
            $printer->feed();
            $printer->text($this->formatHari($tanggal) . " , " . $jam . "\n");
            $printer->text("PIN Antrean : " . $pin . "\n");
            $printer->feed(2);

            $printer->cut();
            $printer->pulse();
            $printer->close();

            return ['status' => true, 'message' => 'Dokumen berhasil dicetak!'];
        } catch (Exception $e) {
            return ['status' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }
}

$pos = new StrukPrinter();
echo json_encode($pos->printStruk());
