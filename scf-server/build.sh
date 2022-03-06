#curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
#rustup target add x86_64-unknown-linux-musl
#sudo apt update
#sudo apt install build-essential
#sudo apt install pkgconf
#sudo apt install openssl libssl-dev -y

RUSTFLAGS='-C target-feature=+crt-static' cargo build --target=x86_64-unknown-linux-gnu --release
cp target/x86_64-unknown-linux-gnu/release/scf-server pkg/bootstrap
cd pkg
chmod 755 ./bootstrap
zip pkg.zip bootstrap