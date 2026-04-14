#!/usr/bin/env python3
import argparse
import json
import subprocess
import sys


def run(command):
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        sys.stderr.write(result.stderr)
        raise SystemExit(result.returncode)
    return result.stdout


def add_port_bindings(cmd, port_bindings):
    if not port_bindings:
        return
    for container_port, bindings in port_bindings.items():
        if not bindings:
            continue
        for b in bindings:
            host_ip = (b.get("HostIp") or "").strip()
            host_port = (b.get("HostPort") or "").strip()
            if host_ip and host_ip != "0.0.0.0":
                published = f"{host_ip}:{host_port}:{container_port}"
            elif host_port:
                published = f"{host_port}:{container_port}"
            else:
                published = container_port
            cmd.extend(["-p", published])


def main():
    parser = argparse.ArgumentParser(
        description="Recreate a Docker container with the same runtime config but a new image."
    )
    parser.add_argument("--container", default="baserow")
    parser.add_argument("--image", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    inspected = run(["docker", "inspect", args.container]).strip()
    data = json.loads(inspected)[0]

    host = data.get("HostConfig", {})
    config = data.get("Config", {})
    name = (data.get("Name") or f"/{args.container}").lstrip("/")

    run_cmd = ["docker", "run", "-d", "--name", name]

    restart_name = (host.get("RestartPolicy") or {}).get("Name")
    if restart_name:
        run_cmd.extend(["--restart", restart_name])

    network_mode = host.get("NetworkMode")
    if network_mode and network_mode not in {"default", "bridge"}:
        run_cmd.extend(["--network", network_mode])

    for bind in host.get("Binds") or []:
        run_cmd.extend(["-v", bind])

    add_port_bindings(run_cmd, host.get("PortBindings"))

    for env in config.get("Env") or []:
        run_cmd.extend(["-e", env])

    entrypoint = config.get("Entrypoint") or []
    if entrypoint:
        run_cmd.extend(["--entrypoint", entrypoint[0]])

    run_cmd.append(args.image)
    run_cmd.extend(config.get("Cmd") or [])

    if args.dry_run:
        redacted = []
        i = 0
        while i < len(run_cmd):
            token = run_cmd[i]
            if token == "-e" and i + 1 < len(run_cmd):
                key = run_cmd[i + 1].split("=", 1)[0]
                redacted.extend(["-e", f"{key}=<redacted>"])
                i += 2
                continue
            redacted.append(token)
            i += 1
        print(" ".join(redacted))
        return

    subprocess.run(["docker", "rm", "-f", name], check=False)
    subprocess.run(run_cmd, check=True)


if __name__ == "__main__":
    main()
